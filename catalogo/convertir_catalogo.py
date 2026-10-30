"""Convierte Catalogo_Dropshipping.xlsx al formato de importación de WooCommerce (Zeltron Core)."""
import csv, math, re, sys
import openpyxl

SRC = sys.argv[1]
OUT_CSV = sys.argv[2]

# Categoría del Excel -> (categoría de la tienda, subcategoría). Audio y Accesorios se separan por nombre.
def classify(cat, name):
    n = name.lower()
    if cat == 'Celulares': return ('Celulares y tablets', 'Celulares')
    if cat == 'Tablets': return ('Celulares y tablets', 'Tablets')
    if cat == 'Wearables': return ('Celulares y tablets', 'Relojes inteligentes')
    if cat == 'Audio':
        if 'parlante' in n or re.search(r'jbl (charge|flip|clip|grip|partybox)', n): return ('Audio', 'Parlantes')
        return ('Audio', 'Audífonos')
    if cat == 'Accesorios':
        if 'cable' in n: return ('Accesorios', 'Cables')
        if 'power bank' in n: return ('Accesorios', 'Power banks')
        return ('Accesorios', 'Cargadores')
    if cat == 'Periféricos': return ('Computación', 'Periféricos')
    if cat == 'Portátiles': return ('Computación', 'Portátiles')
    if cat == 'Impresoras': return ('Computación', 'Impresoras')
    if cat == 'Televisores': return ('TV y consolas', 'Televisores')
    if cat == 'Consolas': return ('TV y consolas', 'Consolas')
    if cat == 'Cámaras de seguridad': return ('Hogar', 'Cámaras de seguridad')
    if cat == 'Electromenores': return ('Hogar', 'Electrodomésticos')
    if cat == 'Vehículos eléctricos': return ('Movilidad eléctrica', 'Motos eléctricas')
    if cat == 'Scooters': return ('Movilidad eléctrica', 'Scooters y patinetas')
    raise ValueError(f'Categoría sin mapear: {cat}')

# Margen sobre el costo por subcategoría (propuesta; se edita en la hoja "Márgenes").
MARGINS = {
    'Celulares': 0.15, 'Tablets': 0.18, 'Relojes inteligentes': 0.30,
    'Audífonos': 0.35, 'Parlantes': 0.30,
    'Cables': 1.00, 'Cargadores': 0.80, 'Power banks': 0.60,
    'Portátiles': 0.12, 'Periféricos': 0.80, 'Impresoras': 0.15,
    'Televisores': 0.12, 'Consolas': 0.10,
    'Cámaras de seguridad': 0.35, 'Electrodomésticos': 0.35,
    'Motos eléctricas': 0.12, 'Scooters y patinetas': 0.15,
}
MIN_PROFIT = 12000  # ganancia mínima por unidad (COP) para cubrir la logística del contra entrega

def sale_price(cost, pct):
    raw = round(max(cost * (1 + pct), cost + MIN_PROFIT), 2)  # evita errores de coma flotante (1.900.000 × 1,10)
    step = 1000 if raw < 1_000_000 else 10000
    return int(math.ceil(raw / step) * step - 100)

BRANDS = ['Black+Decker', 'Nintendo', 'Sony', 'Samsung', 'Xiaomi', 'Redmi', 'Honor', 'Infinix', 'Motorola', 'Tecno',
          'ZTE', 'JBL', 'Ezviz', 'Epson', 'HP', 'Lenovo', 'Dell', 'Asus', 'Acer', 'TCL', 'Emove', 'Mobulaa', 'Vsett',
          'Sunra', 'Yadea', 'L&L']

def brand_of(name, desc):
    if 'marca 1Hora' in desc: return '1Hora'
    for b in BRANDS:
        if re.search(r'(^|\s)' + re.escape(b) + r'(\s|$)', name, re.I):
            return 'Xiaomi' if b == 'Redmi' else b
    return ''

def parse(desc):
    colors, stock, supplier_ref = [], None, ''
    m = re.search(r'Colores?:\s*([^.]+)\.?', desc)
    if m:
        colors = [c.strip() for c in m.group(1).split(',') if c.strip()]
        desc = desc.replace(m.group(0), '')
    m = re.search(r'\bColor (\w+)\.', desc)
    if m:
        colors = [m.group(1).capitalize()]
        desc = desc.replace(m.group(0), '')
    m = re.search(r'Unidades disponibles:\s*(\d+)\.?', desc)
    if m:
        stock = int(m.group(1)); desc = desc.replace(m.group(0), '')
    m = re.search(r'Referencia del proveedor:\s*([^\s.]+(?:\.[^\s]+)?)\.?', desc)
    if m:
        supplier_ref = m.group(1).rstrip('.'); desc = desc.replace(m.group(0), '')
    desc = desc.replace('Precio mayorista.', '')
    desc = re.sub(r'\s+', ' ', desc).strip()
    return desc, colors, stock, supplier_ref

def specs_of(name, desc, sub):
    specs = []
    m = re.search(r'(\d+)GB\+(\d+)(GB|TB)', name)
    if m:
        specs += [('RAM', f'{m.group(1)} GB'), ('Almacenamiento', f'{m.group(2)} {m.group(3)}')]
    if sub == 'Portátiles':
        parts = [p.strip() for p in re.sub(r'^Portátil\s*', '', desc).rstrip('.').split(',')]
        labels = ['Pantalla', 'Procesador', 'RAM', 'Almacenamiento', 'Sistema operativo']
        specs += [(l, re.sub(r'\s*RAM$', '', p)) for l, p in zip(labels, parts) if p]
    if sub == 'Televisores':
        m = re.search(r'(\d+)"', name)
        if m: specs.append(('Pantalla', f'{m.group(1)} pulgadas'))
        specs.append(('Resolución', '4K UHD'))
    m = re.search(r'(\d+)\s?W(?: RMS)?\b', name)
    if m and sub in ('Parlantes', 'Scooters y patinetas'):
        specs.append(('Potencia', m.group(0).replace(' RMS', ' RMS')))
    return specs

def slugify(s):
    import unicodedata
    s = unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')

def load(src):
    ws = openpyxl.load_workbook(src)['Catálogo']
    products = []
    for ref, name, cat, cost, _img, desc, prompt in ws.iter_rows(min_row=2, values_only=True):
        if not ref: continue
        parent, sub = classify(cat, name)
        clean, colors, stock, sref = parse(desc or '')
        products.append(dict(
            sku=str(ref).strip(), name=name.strip(), source_category=cat, category=parent, subcategory=sub,
            cost=int(cost), pct=MARGINS[sub], price=sale_price(int(cost), MARGINS[sub]),
            brand=brand_of(name, desc or ''), description=clean, colors=colors, stock=stock,
            supplier_ref=sref, specs=specs_of(name, clean, sub), prompt=prompt or '',
        ))
    return products

HEADERS = ['Type', 'SKU', 'Name', 'Parent', 'Published', 'Is featured?', 'Visibility in catalog', 'Short description',
           'Description', 'Tax status', 'In stock?', 'Stock', 'Backorders allowed?', 'Regular price', 'Categories',
           'Images']
MAX_ATTR = 6
for i in range(1, MAX_ATTR + 1):
    HEADERS += [f'Attribute {i} name', f'Attribute {i} value(s)', f'Attribute {i} visible', f'Attribute {i} global', f'Attribute {i} default']
HEADERS += ['Meta: _zx_supplier', 'Meta: _zx_supplier_cost', 'Meta: _zx_best_seller', 'Meta: _zx_free_shipping']

def rows_for(p):
    variable = len(p['colors']) > 1
    attrs = []
    if p['colors']:
        attrs.append(('Color', ', '.join(p['colors']), 1, 1, p['colors'][0] if variable else ''))
    if p['brand']:
        attrs.append(('Marca', p['brand'], 1, 1, ''))
    for label, value in p['specs']:
        attrs.append((label, value, 1, 0, ''))
    attrs = attrs[:MAX_ATTR]
    base = {h: '' for h in HEADERS}
    base.update({
        'Type': 'variable' if variable else 'simple', 'SKU': p['sku'], 'Name': p['name'], 'Published': 1,
        'Is featured?': 0, 'Visibility in catalog': 'visible', 'Short description': p['description'],
        'Description': p['description'], 'Tax status': 'none', 'In stock?': 1,
        'Stock': p['stock'] if p['stock'] is not None and not variable else '',
        'Backorders allowed?': 0,
        'Regular price': '' if variable else p['price'],
        'Categories': f"{p['category']} > {p['subcategory']}",
        'Meta: _zx_supplier': f"Ref. proveedor {p['supplier_ref']}" if p['supplier_ref'] else '',
        'Meta: _zx_supplier_cost': p['cost'], 'Meta: _zx_best_seller': 'no', 'Meta: _zx_free_shipping': 'no',
    })
    for i, (n, v, vis, glob, default) in enumerate(attrs, 1):
        base.update({f'Attribute {i} name': n, f'Attribute {i} value(s)': v, f'Attribute {i} visible': vis,
                     f'Attribute {i} global': glob, f'Attribute {i} default': default})
    out = [base]
    if variable:
        for color in p['colors']:
            v = {h: '' for h in HEADERS}
            v.update({'Type': 'variation', 'SKU': f"{p['sku']}-{slugify(color).upper()}", 'Name': f"{p['name']} - {color}",
                      'Parent': p['sku'], 'Published': 1, 'Visibility in catalog': 'visible', 'Tax status': 'none', 'In stock?': 1,
                      'Backorders allowed?': 0, 'Regular price': p['price'],
                      'Attribute 1 name': 'Color', 'Attribute 1 value(s)': color, 'Attribute 1 global': 1,
                      'Meta: _zx_supplier_cost': p['cost']})
            out.append(v)
    return out

if __name__ == '__main__':
    products = load(SRC)
    with open(OUT_CSV, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=HEADERS)
        w.writeheader()
        n = 0
        for p in products:
            for r in rows_for(p):
                w.writerow(r); n += 1
    print(f'{len(products)} productos, {n} filas, variables: {sum(1 for p in products if len(p["colors"])>1)}')
