const products = [
    {
       "sku":"SM-S928B-256",
       "name":"Galaxy S24 Ultra 256GB",
       "description":"Premium smartphone with advanced AI camera features and a built-in S Pen.",
       "isActive":true,
       "categorySlugs":[
          "smartphones"
       ],
       "images":[
          {
             "imageUrl":"https://images.unsplash.com/photo-1706300896423-7d08346e8dbb?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8c2Ftc3VuZyUyMHMyNHxlbnwwfHwwfHx8MA%3D%3D",
             "altText":"Galaxy S24 Ultra front view",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://images.unsplash.com/photo-1706372124814-417e2f0c3fe0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8c2Ftc3VuZyUyMHMyNHxlbnwwfHwwfHx8MA%3D%3D",
             "altText":"Galaxy S24 Ultra back view with cameras",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://images.unsplash.com/photo-1706372124839-f35d821ccd24?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8c2Ftc3VuZyUyMHMyNHxlbnwwfHwwfHx8MA%3D%3D",
             "altText":"Galaxy S24 Ultra side view with S Pen",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://images.unsplash.com/photo-1706469980815-e2c54ace4560?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8c2Ftc3VuZyUyMHMyNHxlbnwwfHwwfHx8MA%3D%3D",
             "altText":"Galaxy S24 Ultra in hand",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Color":"Titanium Gray",
                "colorHex":"#8a8d8f",
                "Storage":"256GB"
             },
             "price":1299.99,
             "costPrice":950.00,
             "initialStockQuantity":25,
             "lowStockThreshold":5
          },
          {
             "attributes":{
                "Color":"Titanium Black",
                "colorHex":"#3d3d3d",
                "Storage":"256GB"
             },
             "price":1299.99,
             "costPrice":950.00,
             "initialStockQuantity":20,
             "lowStockThreshold":5
          },
          {
             "attributes":{
                "Color":"Titanium Violet",
                "colorHex":"#c4c3d0",
                "Storage":"256GB"
             },
             "price":1299.99,
             "costPrice":950.00,
             "initialStockQuantity":15,
             "lowStockThreshold":3
          }
       ]
    },
    {
       "sku":"GO-PX8-PRO-128",
       "name":"Google Pixel 8 Pro 128GB",
       "description":"The Google-engineered phone with a powerful camera system and clean Android experience.",
       "isActive":true,
       "categorySlugs":[
          "smartphones"
       ],
       "images":[
          {
             "imageUrl":"https://images.unsplash.com/photo-1587840181242-bf05eb933bbc?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Z29vZ2xlJTIwcGl4ZWx8ZW58MHx8MHx8fDA%3D",
             "altText":"Google Pixel 8 Pro front",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://images.unsplash.com/photo-1706412703794-d944cd3625b3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8Z29vZ2xlJTIwcGl4ZWx8ZW58MHx8MHx8fDA%3D",
             "altText":"Google Pixel 8 Pro camera bar",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://images.unsplash.com/photo-1697355360151-2866de32ad4d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGdvb2dsZSUyMHBpeGVsfGVufDB8fDB8fHww",
             "altText":"Google Pixel 8 Pro side angle",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://images.unsplash.com/photo-1724438192699-89f587b04c24?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGdvb2dsZSUyMHBpeGVsfGVufDB8fDB8fHww",
             "altText":"Google Pixel 8 Pro display detail",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Color":"Obsidian",
                "colorHex":"#1c1c1e",
                "Storage":"128GB"
             },
             "price":999.00,
             "costPrice":720.00,
             "initialStockQuantity":30,
             "lowStockThreshold":8
          },
          {
             "attributes":{
                "Color":"Porcelain",
                "colorHex":"#e6e1da",
                "Storage":"128GB"
             },
             "price":999.00,
             "costPrice":720.00,
             "initialStockQuantity":25,
             "lowStockThreshold":8
          },
          {
             "attributes":{
                "Color":"Bay",
                "colorHex":"#a5c9d9",
                "Storage":"128GB"
             },
             "price":999.00,
             "costPrice":720.00,
             "initialStockQuantity":22,
             "lowStockThreshold":8
          }
       ]
    },
    {
       "sku":"OP-12-GL-256",
       "name":"OnePlus 12 256GB",
       "description":"Flagship performance with ultra-fast charging and a smooth, responsive display.",
       "isActive":true,
       "categorySlugs":[
          "smartphones"
       ],
       "images":[
          {
             "imageUrl":"https://oasis.opstatics.com/content/dam/oasis/page/press-photos/10t/green/10T-1.png",
             "altText":"OnePlus 12 front display",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://oasis.opstatics.com/content/dam/oasis/page/press-photos/10t/green/10T-3.png",
             "altText":"OnePlus 12 rear camera module",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://oasis.opstatics.com/content/dam/oasis/page/press-photos/10t/green/10T-6.png",
             "altText":"OnePlus 12 side profile",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://oasis.opstatics.com/content/dam/oasis/page/press-photos/10t/green/10T-5.png",
             "altText":"OnePlus 12 charging port detail",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Color":"Flowy Emerald",
                "colorHex":"#009c75",
                "Storage":"256GB"
             },
             "price":799.99,
             "costPrice":580.00,
             "initialStockQuantity":20,
             "lowStockThreshold":5
          },
          {
             "attributes":{
                "Color":"Silky Black",
                "colorHex":"#1a1a1a",
                "Storage":"256GB"
             },
             "price":799.99,
             "costPrice":580.00,
             "initialStockQuantity":30,
             "lowStockThreshold":5
          }
       ]
    },
    {
       "sku":"DELL-XPS-15-9530",
       "name":"Dell XPS 15 Laptop",
       "description":"A high-performance 15-inch laptop with a stunning InfinityEdge display, ideal for creative professionals.",
       "isActive":true,
       "categorySlugs":[
          "ordinateurs-portables"
       ],
       "images":[
          {
             "imageUrl":"https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/xps-notebooks/xps-15-9530/media-gallery/touch-black/notebook-xps-15-9530-t-black-gallery-1.psd?fmt=png-alpha&pscan=auto&scl=1&hei=402&wid=654&qlt=100,1&resMode=sharp2&size=654,402&chrss=full",
             "altText":"Dell XPS 15 open front view",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/xps-notebooks/xps-15-9530/media-gallery/touch-black/notebook-xps-15-9530-t-black-gallery-4.psd?fmt=png-alpha&pscan=auto&scl=1&hei=402&wid=677&qlt=100,1&resMode=sharp2&size=677,402&chrss=full",
             "altText":"Dell XPS 15 closed top view",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/xps-notebooks/xps-15-9530/media-gallery/touch-black/notebook-xps-15-9530-t-black-gallery-3.psd?fmt=png-alpha&pscan=auto&scl=1&hei=402&wid=518&qlt=100,1&resMode=sharp2&size=518,402&chrss=full",
             "altText":"Dell XPS 15 keyboard and trackpad",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/notebooks/xps-notebooks/xps-15-9530/media-gallery/touch-black/notebook-xps-15-9530-t-black-gallery-5.psd?fmt=png-alpha&pscan=auto&scl=1&hei=402&wid=677&qlt=100,1&resMode=sharp2&size=677,402&chrss=full",
             "altText":"Dell XPS 15 side view with ports",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "CPU":"Intel Core i7",
                "RAM":"16GB",
                "Storage":"1TB SSD"
             },
             "price":2149.00,
             "costPrice":1600.00,
             "initialStockQuantity":15,
             "lowStockThreshold":3
          },
          {
             "attributes":{
                "CPU":"Intel Core i7",
                "RAM":"32GB",
                "Storage":"1TB SSD"
             },
             "price":2349.00,
             "costPrice":1750.00,
             "initialStockQuantity":10,
             "lowStockThreshold":2
          },
          {
             "attributes":{
                "CPU":"Intel Core i9",
                "RAM":"32GB",
                "Storage":"2TB SSD"
             },
             "price":2799.00,
             "costPrice":2100.00,
             "initialStockQuantity":5,
             "lowStockThreshold":1
          }
       ]
    },
    {
       "sku":"LEN-TP-X1C-G11",
       "name":"Lenovo ThinkPad X1 Carbon Gen 11",
       "description":"Ultra-light and durable business laptop with a renowned keyboard and robust security features.",
       "isActive":true,
       "categorySlugs":[
          "ordinateurs-portables"
       ],
       "images":[
          {
             "imageUrl":"https://p3-ofp.static.pub//fes/cms/2024/07/05/umcrxcnsm2br1itju6gvundeb9s6tf364734.png",
             "altText":"Lenovo ThinkPad X1 Carbon front view",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://p3-ofp.static.pub//fes/cms/2024/07/05/3euk5fn03von01bjlreh1bmgmzp3kf055467.png",
             "altText":"Lenovo ThinkPad X1 Carbon side profile",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://p1-ofp.static.pub//fes/cms/2024/07/05/6vqjiceenchqp8t3nn2fakjorw1skx301104.png",
             "altText":"Lenovo ThinkPad X1 Carbon partially closed",
             "isPrimary":false,
             "order":3
          }
       ],
       "variants":[
          {
             "attributes":{
                "CPU":"Intel Core i7",
                "RAM":"32GB",
                "Storage":"1TB SSD"
             },
             "price":2399.00,
             "costPrice":1850.00,
             "initialStockQuantity":12,
             "lowStockThreshold":2
          },
          {
             "attributes":{
                "CPU":"Intel Core i7",
                "RAM":"16GB",
                "Storage":"512GB SSD"
             },
             "price":2099.00,
             "costPrice":1600.00,
             "initialStockQuantity":18,
             "lowStockThreshold":4
          }
       ]
    },
    {
       "sku":"HP-SP-X360-14",
       "name":"HP Spectre x360 14",
       "description":"A versatile 2-in-1 convertible laptop with a premium design and OLED touch display.",
       "isActive":true,
       "categorySlugs":[
          "ordinateurs-portables"
       ],
       "images":[
          {
             "imageUrl":"https://hp.widen.net/content/roxa0cksxi/webp/roxa0cksxi.png?w=573&h=430&dpi=72&color=ffffff00",
             "altText":"HP Spectre x360 in laptop mode",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://hp.widen.net/content/ooy0qpqflv/webp/ooy0qpqflv.png?w=573&h=430&dpi=72&color=ffffff00",
             "altText":"HP Spectre x360 in tent mode",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://hp.widen.net/content/cilslnxchx/webp/cilslnxchx.png?w=573&h=430&dpi=72&color=ffffff00",
             "altText":"HP Spectre x360 in tablet mode",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://hp.widen.net/content/y9dfkn5rnr/webp/y9dfkn5rnr.png?w=573&h=430&dpi=72&color=ffffff00",
             "altText":"HP Spectre x360 side view showing ports",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "CPU":"Intel Core Ultra 7",
                "RAM":"16GB",
                "Storage":"1TB SSD",
                "Color":"Nightfall Black",
                "colorHex":"#2a2a30"
             },
             "price":1649.99,
             "costPrice":1200.00,
             "initialStockQuantity":18,
             "lowStockThreshold":4
          },
          {
             "attributes":{
                "CPU":"Intel Core Ultra 7",
                "RAM":"16GB",
                "Storage":"1TB SSD",
                "Color":"Nocturne Blue",
                "colorHex":"#30394d"
             },
             "price":1649.99,
             "costPrice":1200.00,
             "initialStockQuantity":15,
             "lowStockThreshold":4
          }
       ]
    },
    {
       "sku":"LOGI-MX-MASTER-3S",
       "name":"Logitech MX Master 3S Mouse",
       "description":"Advanced wireless performance mouse with an ergonomic design and quiet clicks.",
       "isActive":true,
       "categorySlugs":[
          "accessoires-electroniques"
       ],
       "images":[
          {
             "imageUrl":"https://resource.logitech.com/w_544,h_466,ar_7:6,c_pad,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/mice/mx-master-3s/migration-assets-for-delorean-2025/gallery/mx-master-3s-top-view-graphite.png",
             "altText":"Logitech MX Master 3S top view",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://resource.logitech.com/e_trim/w_544,h_544,ar_1,c_fill,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/mice/mx-master-3s/migration-assets-for-delorean-2025/gallery/person-using-mx-master-3s-on-glass-surface-graphite.jpg",
             "altText":"Logitech MX Master 3S side view",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://resource.logitech.com/w_544,h_466,ar_7:6,c_pad,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/mice/mx-master-3s/migration-assets-for-delorean-2025/gallery/mx-master-3s-left-profile-view-graphite.png",
             "altText":"Logitech MX Master 3S with charging cable",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://resource.logitech.com/w_544,h_466,ar_7:6,c_pad,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/mice/mx-master-3s/migration-assets-for-delorean-2025/gallery/mx-master-3s-in-the-box-graphite.png",
             "altText":"Logitech MX Master 3S bottom view",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Color":"Graphite",
                "colorHex":"#383838"
             },
             "price":99.99,
             "costPrice":65.00,
             "initialStockQuantity":150,
             "lowStockThreshold":20
          },
          {
             "attributes":{
                "Color":"Pale Gray",
                "colorHex":"#e0e0e0"
             },
             "price":99.99,
             "costPrice":65.00,
             "initialStockQuantity":90,
             "lowStockThreshold":15
          }
       ]
    },
    {
       "sku":"ANKR-737-PWRBNK",
       "name":"Anker 737 Power Bank (PowerCore 24K)",
       "description":"High-capacity 24,000mAh power bank with 140W fast charging output.",
       "isActive":true,
       "categorySlugs":[
          "accessoires-electroniques"
       ],
       "images":[
          {
             "imageUrl":"https://cdn.shopify.com/s/files/1/0493/9834/9974/products/A1289011-Anker_737_Power_Bank_PowerCore_24K_1_2880x.png?v=1672388225",
             "altText":"Anker 737 Power Bank front",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://cdn.shopify.com/s/files/1/0493/9834/9974/products/A1289011_TD03_V1_2880x.jpg?v=1672388224",
             "altText":"Anker 737 Power Bank with smart display",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://cdn.shopify.com/s/files/1/0493/9834/9974/files/Rectangle1_885945a5-b5d8-439f-bc99-54bf72715ff4_2880x.png?v=1747217076",
             "altText":"Anker 737 Power Bank showing ports",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://cdn.shopify.com/s/files/1/0493/9834/9974/files/A1340011_Rich_image_TD02_US_1600x2000px_V1.jpg?v=1747217076",
             "altText":"Anker 737 Power Bank charging a laptop",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Color":"Black",
                "colorHex":"#000000"
             },
             "price":149.99,
             "costPrice":105.00,
             "initialStockQuantity":80,
             "lowStockThreshold":10
          }
       ]
    },
    {
       "sku":"SONY-WH1000XM5-BLK",
       "name":"Sony WH-1000XM5 Wireless Headphones",
       "description":"Industry-leading noise canceling headphones with exceptional sound quality.",
       "isActive":true,
       "categorySlugs":[
          "accessoires-electroniques"
       ],
       "images":[
          {
             "imageUrl":"https://d1ncau8tqf99kp.cloudfront.net/converted/103364_original_local_1200x1050_v3_converted.webp",
             "altText":"Sony WH-1000XM5 headphones side view",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://d1ncau8tqf99kp.cloudfront.net/converted/103368_original_local_1200x1050_v3_converted.webp",
             "altText":"Sony WH-1000XM5 headphones folded in case",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://d1ncau8tqf99kp.cloudfront.net/converted/103372_original_local_1200x1050_v3_converted.webp",
             "altText":"Sony WH-1000XM5 earcup detail",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://d1ncau8tqf99kp.cloudfront.net/converted/103373_original_local_1200x1050_v3_converted.webp",
             "altText":"Sony WH-1000XM5 on a person's head",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Color":"Black",
                "colorHex":"#000000"
             },
             "price":399.99,
             "costPrice":280.00,
             "initialStockQuantity":40,
             "lowStockThreshold":5
          },
          {
             "attributes":{
                "Color":"Silver",
                "colorHex":"#d3d3d3"
             },
             "price":399.99,
             "costPrice":280.00,
             "initialStockQuantity":35,
             "lowStockThreshold":5
          },
          {
             "attributes":{
                "Color":"Midnight Blue",
                "colorHex":"#003366"
             },
             "price":399.99,
             "costPrice":280.00,
             "initialStockQuantity":30,
             "lowStockThreshold":5
          }
       ]
    },
    {
       "sku":"LOGI-MX-KEYS-S",
       "name":"Logitech MX Keys S Keyboard",
       "description":"Advanced wireless illuminated keyboard with smart actions and comfortable typing.",
       "isActive":true,
       "categorySlugs":[
          "accessoires-electroniques"
       ],
       "images":[
          {
             "imageUrl":"https://resource.logitech.com/w_692,c_lpad,ar_4:3,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/keyboards/mx-keys-for-business/gallery/mx-keys-business-keyboard-gallery-ita-graphite-1.png?v=1",
             "altText":"Logitech MX Keys S Keyboard top view",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://resource.logitech.com/w_692,c_lpad,ar_4:3,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/keyboards/mx-keys-for-business/gallery/mx-keys-business-keyboard-gallery-ita-graphite-2.png?v=1",
             "altText":"Logitech MX Keys S Keyboard side profile",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://resource.logitech.com/w_692,c_lpad,ar_4:3,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/keyboards/mx-keys-for-business/gallery/mx-keys-business-keyboard-gallery-ita-graphite-3.png?v=1",
             "altText":"Logitech MX Keys S Keyboard backlighting",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://resource.logitech.com/w_692,c_lpad,ar_4:3,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/keyboards/mx-keys-for-business/gallery/mx-keys-business-keyboard-gallery-ita-graphite-4.png?v=1",
             "altText":"Logitech MX Keys S Keyboard on a desk",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Color":"Graphite",
                "colorHex":"#383838"
             },
             "price":109.99,
             "costPrice":75.00,
             "initialStockQuantity":75,
             "lowStockThreshold":15
          },
          {
             "attributes":{
                "Color":"Pale Gray",
                "colorHex":"#e0e0e0"
             },
             "price":109.99,
             "costPrice":75.00,
             "initialStockQuantity":50,
             "lowStockThreshold":10
          }
       ]
    },
    {
       "sku":"NK-AIR-FORCE-1-WHT",
       "name":"Nike Air Force 1 '07",
       "description":"The classic, iconic basketball shoe that has become a streetwear staple. Crisp leather and timeless design.",
       "isActive":true,
       "categorySlugs":[
          "chaussures"
       ],
       "images":[
          {
             "imageUrl":"https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/4f37fca8-6bce-43e7-ad07-f57ae3c13142/AIR+FORCE+1+%2707.png",
             "altText":"Nike Air Force 1 '07 side view",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/e777c881-5b62-4250-92a6-362967f54cca/WMNS+AIR+FORCE+1+%2707.png",
             "altText":"Nike Air Force 1 '07 top view",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/b4166080-0977-4252-99e9-bb773cffefc4/FORCE+1+LOW+EASYON+%28PS%29.png",
             "altText":"Nike Air Force 1 '07 back heel view",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://static.nike.com/a/images/c_limit,w_592,f_auto/t_product_v1/c0b7c82d-baa6-4070-bb3b-1e32d5c96124/WMNS+AIR+FORCE+1+%2707+NN.png",
             "altText":"Nike Air Force 1 '07 sole detail",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Color":"White",
                "colorHex":"#FFFFFF",
                "Size":"10"
             },
             "price":110.00,
             "costPrice":60.00,
             "initialStockQuantity":50,
             "lowStockThreshold":10
          },
          {
             "attributes":{
                "Color":"White",
                "colorHex":"#FFFFFF",
                "Size":"9"
             },
             "price":110.00,
             "costPrice":60.00,
             "initialStockQuantity":45,
             "lowStockThreshold":10
          },
          {
             "attributes":{
                "Color":"Black",
                "colorHex":"#000000",
                "Size":"10"
             },
             "price":110.00,
             "costPrice":60.00,
             "initialStockQuantity":60,
             "lowStockThreshold":10
          }
       ]
    },
    {
       "sku":"AD-ULTRABOOST-1-BLK",
       "name":"Adidas Ultraboost 1.0",
       "description":"Performance running shoes with responsive Boost cushioning for incredible energy return.",
       "isActive":true,
       "categorySlugs":[
          "chaussures"
       ],
       "images":[
          {
             "imageUrl":"https://assets.adidas.com/images/w_383,h_383,f_auto,q_auto,fl_lossy,c_fill,g_auto/f595c3974bb84e60a437b4d141cd38ec_9366/ultraboost-1.0-shoes.jpg",
             "altText":"Adidas Ultraboost 1.0 side profile",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://assets.adidas.com/images/w_383,h_383,f_auto,q_auto,fl_lossy,c_fill,g_auto/9468858abb6f45c1baa244f95f28162f_9366/ultraboost-1.0-shoes.jpg",
             "altText":"Adidas Ultraboost 1.0 top-down view",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://assets.adidas.com/images/w_383,h_383,f_auto,q_auto,fl_lossy,c_fill,g_auto/bac599d8f6644598a4e5c8e6a836c804_9366/ultraboost-1.0-shoes.jpg",
             "altText":"Adidas Ultraboost 1.0 sole view",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://assets.adidas.com/images/w_383,h_383,f_auto,q_auto,fl_lossy,c_fill,g_auto/1cc0e569982d4eb78337703a157450d8_9366/ultraboost-1.0-shoes.jpg",
             "altText":"Adidas Ultraboost 1.0 on a runner",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Color":"Core Black",
                "colorHex":"#000000",
                "Size":"10.5"
             },
             "price":180.00,
             "costPrice":95.00,
             "initialStockQuantity":35,
             "lowStockThreshold":7
          },
          {
             "attributes":{
                "Color":"Core Black",
                "colorHex":"#000000",
                "Size":"9.5"
             },
             "price":180.00,
             "costPrice":95.00,
             "initialStockQuantity":30,
             "lowStockThreshold":7
          },
          {
             "attributes":{
                "Color":"Cloud White",
                "colorHex":"#FFFFFF",
                "Size":"10.5"
             },
             "price":180.00,
             "costPrice":95.00,
             "initialStockQuantity":40,
             "lowStockThreshold":7
          }
       ]
    },
    {
       "sku":"NB-990V6-GRY",
       "name":"New Balance 990v6",
       "description":"Premium lifestyle sneaker known for its exceptional comfort and quality craftsmanship.",
       "isActive":true,
       "categorySlugs":[
          "chaussures"
       ],
       "images":[
          {
             "imageUrl":"https://cdn-images.farfetch-contents.com/19/36/38/27/19363827_44338928_1000.jpg",
             "altText":"New Balance 990v6 side view",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://cdn-images.farfetch-contents.com/19/36/38/27/19363827_44338925_2048.jpg",
             "altText":"New Balance 990v6 back detail",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://cdn-images.farfetch-contents.com/19/36/38/27/19363827_44340201_2048.jpg",
             "altText":"New Balance 990v6 top view",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://cdn-images.farfetch-contents.com/19/36/38/27/19363827_44340199_2048.jpg",
             "altText":"New Balance 990v6 angled front",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Color":"Grey",
                "colorHex":"#808080",
                "Size":"9.5"
             },
             "price":199.99,
             "costPrice":120.00,
             "initialStockQuantity":25,
             "lowStockThreshold":5
          },
          {
             "attributes":{
                "Color":"Grey",
                "colorHex":"#808080",
                "Size":"10"
             },
             "price":199.99,
             "costPrice":120.00,
             "initialStockQuantity":20,
             "lowStockThreshold":5
          },
          {
             "attributes":{
                "Color":"Navy",
                "colorHex":"#000080",
                "Size":"9.5"
             },
             "price":199.99,
             "costPrice":120.00,
             "initialStockQuantity":15,
             "lowStockThreshold":3
          }
       ]
    },
    {
       "sku":"HM-POANG-CHAIR-BRCH",
       "name":"Poäng Armchair",
       "description":"A classic and comfortable armchair with a bentwood frame that provides nice resilience.",
       "isActive":true,
       "categorySlugs":[
          "meubles"
       ],
       "images":[
          {
             "imageUrl":"https://www.ikea.com/ext/ingkadam/m/c280f12c0638f54/original/PH187101.jpg?f=m",
             "altText":"Poäng Armchair front view",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://www.ikea.com/ext/ingkadam/m/7dfbd77bdbfa8aaf/original/PH186539.jpg?f=m",
             "altText":"Poäng Armchair side profile",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://www.ikea.com/ext/ingkadam/m/256435a11b748bf/original/PH186542.jpg?f=m",
             "altText":"Poäng Armchair cushion detail",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://www.ikea.com/us/en/images/products/poaeng-armchair-and-ottoman-brown-glose-dark-brown__0840639_pe601101_s5.jpg?f=xxs",
             "altText":"Poäng Armchair in a living room setting",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Frame":"Birch veneer",
                "Cushion":"Knisa light beige",
                "Color":"Light Beige",
                "colorHex":"#f5f5dc"
             },
             "price":129.00,
             "costPrice":70.00,
             "initialStockQuantity":30,
             "lowStockThreshold":5
          },
          {
             "attributes":{
                "Frame":"Black-brown veneer",
                "Cushion":"Skiftebo dark gray",
                "Color":"Dark Gray",
                "colorHex":"#595959"
             },
             "price":129.00,
             "costPrice":70.00,
             "initialStockQuantity":25,
             "lowStockThreshold":5
          },
          {
             "attributes":{
                "Frame":"White stained oak veneer",
                "Cushion":"Gunnared medium gray",
                "Color":"Medium Gray",
                "colorHex":"#8d8d8d"
             },
             "price":149.00,
             "costPrice":80.00,
             "initialStockQuantity":20,
             "lowStockThreshold":4
          }
       ]
    },
    {
       "sku":"HM-BEKANT-DESK-WHT",
       "name":"Bekant Sit/Stand Desk",
       "description":"An adjustable height desk that allows you to switch between sitting and standing.",
       "isActive":true,
       "categorySlugs":[
          "bureaux-chaises"
       ],
       "images":[
          {
             "imageUrl":"https://www.ikea.com/gb/en/images/products/segrare-desk-sit-stand-dark-grey__1323413_pe942696_s5.jpg?f=xxs",
             "altText":"Bekant Sit/Stand Desk in standing position",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://www.ikea.com/gb/en/images/products/mittzon-desk-sit-stand-electric-white__1274626_pe930431_s5.jpg?f=xxs",
             "altText":"Bekant Sit/Stand Desk in sitting position",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://www.ikea.com/gb/en/images/products/trotten-desk-sit-stand-white__1033615_pe837351_s5.jpg?f=xxs",
             "altText":"Bekant Sit/Stand Desk height controller",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://www.ikea.com/gb/en/images/products/relatera-desk-sit-stand-white__1355177_pe952949_s5.jpg?f=xxs",
             "altText":"Bekant Sit/Stand Desk surface detail",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Tabletop":"White stained oak veneer",
                "Underframe":"White",
                "Color":"White",
                "colorHex":"#FFFFFF"
             },
             "price":549.99,
             "costPrice":350.00,
             "initialStockQuantity":20,
             "lowStockThreshold":4
          },
          {
             "attributes":{
                "Tabletop":"Black stained ash veneer",
                "Underframe":"Black",
                "Color":"Black",
                "colorHex":"#000000"
             },
             "price":549.99,
             "costPrice":350.00,
             "initialStockQuantity":15,
             "lowStockThreshold":4
          }
       ]
    },
    {
       "sku":"HM-MARKUS-CHAIR-BLK",
       "name":"Markus Office Chair",
       "description":"Ergonomic office chair with a high back and mesh material for comfortable seating during long workdays.",
       "isActive":true,
       "categorySlugs":[
          "bureaux-chaises"
       ],
       "images":[
          {
             "imageUrl":"https://www.ikea.is/static/web/ikea4/images/247/0724714_PE734597_S4.jpg?v=cb2d2e29",
             "altText":"Markus Office Chair front view",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://www.ikea.is/static/web/ikea4/images/303/1030304_PE836200_S4.jpg?v=cb2d2e29",
             "altText":"Markus Office Chair side view",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://www.ikea.is/static/web/ikea4/images/605/1160590_PE888982_S4.jpg?v=cb2d2e29",
             "altText":"Markus Office Chair back mesh detail",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://www.ikea.is/static/web/ikea4/images/014/1101440_PE866425_S4.jpg?v=cb2d2e29",
             "altText":"Markus Office Chair armrest detail",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Color":"Vissle dark grey",
                "colorHex":"#5a5a5a"
             },
             "price":229.00,
             "costPrice":140.00,
             "initialStockQuantity":40,
             "lowStockThreshold":8
          },
          {
             "attributes":{
                "Color":"Glose black",
                "colorHex":"#000000"
             },
             "price":249.00,
             "costPrice":155.00,
             "initialStockQuantity":30,
             "lowStockThreshold":6
          }
       ]
    },
    {
       "sku":"DELL-U2723QE-MONITOR",
       "name":"Dell UltraSharp 27 4K USB-C Hub Monitor",
       "description":"A 27-inch 4K monitor with exceptional color and clarity, featuring IPS Black technology.",
       "isActive":true,
       "categorySlugs":[
          "moniteurs",
          "accessoires-electroniques"
       ],
       "images":[
          {
             "imageUrl":"https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/peripherals/monitors/u-series/u2723qe/media-gallery/monitor-u2723qe-gallery-3.psd?fmt=png-alpha&pscan=auto&scl=1&hei=804&wid=872&qlt=100,1&resMode=sharp2&size=872,804&chrss=full",
             "altText":"Dell UltraSharp 27 Monitor front view",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/peripherals/monitors/u-series/u2723qe/media-gallery/monitor-u2723qe-gallery-2.psd?fmt=png-alpha&pscan=auto&scl=1&hei=804&wid=941&qlt=100,1&resMode=sharp2&size=941,804&chrss=full",
             "altText":"Dell UltraSharp 27 Monitor back view",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/peripherals/monitors/u-series/u2723qe/media-gallery/monitor-u2723qe-gallery-1.psd?fmt=png-alpha&pscan=auto&scl=1&hei=804&wid=1346&qlt=100,1&resMode=sharp2&size=1346,804&chrss=full",
             "altText":"Dell UltraSharp 27 Monitor side view showing ports",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://i.dell.com/is/image/DellContent/content/dam/ss2/product-images/dell-client-products/peripherals/monitors/u-series/u2723qe/media-gallery/monitor-u2723qe-gallery-4.psd?fmt=png-alpha&pscan=auto&scl=1&hei=804&wid=872&qlt=100,1&resMode=sharp2&size=872,804&chrss=full",
             "altText":"Dell UltraSharp 27 Monitor on a desk",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Size":"27-inch",
                "Resolution":"4K UHD"
             },
             "price":619.99,
             "costPrice":450.00,
             "initialStockQuantity":25,
             "lowStockThreshold":5
          }
       ]
    },
    {
       "sku":"LG-34WQHD-CURVED",
       "name":"LG 34-Inch UltraWide QHD Monitor",
       "description":"Curved ultrawide monitor perfect for multitasking and immersive gaming experiences.",
       "isActive":true,
       "categorySlugs":[
          "moniteurs",
          "accessoires-electroniques"
       ],
       "images":[
          {
             "imageUrl":"https://www.lg.com/content/dam/channel/wcms/fr/images/moniteurs/34wr50qk-b/gallery/ultrawide-34wr50qk-gallery-01-2010.jpg/_jcr_content/renditions/thum-1600x1062.jpeg",
             "altText":"LG 34-Inch UltraWide Monitor front view",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://www.lg.com/content/dam/channel/wcms/fr/images/moniteurs/34wr50qk-b/gallery/ultrawide-34wr50qk-gallery-02-2010.jpg/_jcr_content/renditions/thum-1600x1062.jpeg",
             "altText":"LG 34-Inch UltraWide Monitor back view",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://www.lg.com/content/dam/channel/wcms/fr/images/moniteurs/34wr50qk-b/gallery/ultrawide-34wr50qk-gallery-03-2010.jpg/_jcr_content/renditions/thum-1600x1062.jpeg",
             "altText":"LG 34-Inch UltraWide Monitor displaying content",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://www.lg.com/content/dam/channel/wcms/fr/images/moniteurs/34wr50qk-b/gallery/ultrawide-34wr50qk-gallery-05-2010.jpg/_jcr_content/renditions/thum-1600x1062.jpeg",
             "altText":"LG 34-Inch UltraWide Monitor stand detail",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Size":"34-inch",
                "Resolution":"WQHD"
             },
             "price":449.99,
             "costPrice":320.00,
             "initialStockQuantity":30,
             "lowStockThreshold":6
          }
       ]
    },
    {
       "sku":"BENQ-PD2705U-DESIGNVUE",
       "name":"BenQ PD2705U 27-inch 4K Designer Monitor",
       "description":"Color-accurate monitor for creative professionals, featuring AQCOLOR technology.",
       "isActive":true,
       "categorySlugs":[
          "moniteurs",
          "accessoires-electroniques"
       ],
       "images":[
          {
             "imageUrl":"https://m.media-amazon.com/images/I/61Pvf1fZAgL._AC_SX679_.jpg",
             "altText":"BenQ PD2705U monitor front",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://m.media-amazon.com/images/I/51zPJhfN0cL._AC_SX679_.jpg",
             "altText":"BenQ PD2705U monitor with Hotkey Puck",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://m.media-amazon.com/images/I/51iYXep+uoL._AC_SX679_.jpg",
             "altText":"BenQ PD2705U monitor port selection",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://m.media-amazon.com/images/I/41NFJE30YNL._AC_SX679_.jpg",
             "altText":"BenQ PD2705U monitor showing design software",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Size":"27-inch",
                "Type":"Designer"
             },
             "price":549.99,
             "costPrice":410.00,
             "initialStockQuantity":18,
             "lowStockThreshold":4
          }
       ]
    },
    {
       "sku":"HM-KALLAX-SHELF-WHT",
       "name":"Kallax Shelving Unit",
       "description":"A simple and stylish shelving unit that can be placed standing or lying.",
       "isActive":true,
       "categorySlugs":[
          "meubles"
       ],
       "images":[
          {
             "imageUrl":"https://www.ikea.com/us/en/images/products/kallax-shelf-unit-white__0644757_pe702939_s5.jpg?f=s",
             "altText":"Kallax Shelving Unit standing vertically",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://www.ikea.com/us/en/images/products/kallax-shelf-unit-white__1084790_pe859876_s5.jpg?f=s",
             "altText":"Kallax Shelving Unit lying horizontally",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://www.ikea.com/us/en/images/products/kallax-shelf-unit-white__1084796_pe859882_s5.jpg?f=s",
             "altText":"Kallax Shelving Unit with storage boxes",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://www.ikea.com/us/en/images/products/kallax-shelf-unit-white__1106842_pe868819_s5.jpg?f=s",
             "altText":"Kallax Shelving Unit wood texture detail",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Configuration":"4x2",
                "Color":"White",
                "colorHex":"#FFFFFF"
             },
             "price":69.99,
             "costPrice":40.00,
             "initialStockQuantity":60,
             "lowStockThreshold":10
          },
          {
             "attributes":{
                "Configuration":"4x2",
                "Color":"Black-brown",
                "colorHex":"#2e2521"
             },
             "price":69.99,
             "costPrice":40.00,
             "initialStockQuantity":50,
             "lowStockThreshold":10
          },
          {
             "attributes":{
                "Configuration":"2x2",
                "Color":"White",
                "colorHex":"#FFFFFF"
             },
             "price":49.99,
             "costPrice":28.00,
             "initialStockQuantity":70,
             "lowStockThreshold":15
          }
       ]
    },
    {
       "sku":"HM-BILLY-BOOKCASE-WHT",
       "name":"Billy Bookcase",
       "description":"A beloved and versatile bookcase, adaptable to your storage needs.",
       "isActive":true,
       "categorySlugs":[
          "meubles"
       ],
       "images":[
          {
             "imageUrl":"https://www.ikea.com/fr/fr/images/products/billy-bibliotheque-blanc__0625599_pe692385_s5.jpg?f=s",
             "altText":"Billy Bookcase front view",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://www.ikea.com/fr/fr/images/products/billy-bibliotheque-blanc__1051924_pe845813_s5.jpg?f=s",
             "altText":"Billy Bookcase filled with books",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://www.ikea.com/fr/fr/images/products/billy-bibliotheque-blanc__0249652_pe387976_s5.jpg?f=s",
             "altText":"Billy Bookcase shelf detail",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://www.ikea.com/fr/fr/images/products/billy-bibliotheque-blanc__1065928_ph182491_s5.jpg?f=s",
             "altText":"Multiple Billy Bookcases side-by-side",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Width":"31.5 inches",
                "Color":"White",
                "colorHex":"#FFFFFF"
             },
             "price":59.99,
             "costPrice":35.00,
             "initialStockQuantity":75,
             "lowStockThreshold":15
          },
          {
             "attributes":{
                "Width":"31.5 inches",
                "Color":"Black-brown",
                "colorHex":"#2e2521"
             },
             "price":59.99,
             "costPrice":35.00,
             "initialStockQuantity":60,
             "lowStockThreshold":15
          },
          {
             "attributes":{
                "Width":"15.75 inches",
                "Color":"White",
                "colorHex":"#FFFFFF"
             },
             "price":49.99,
             "costPrice":29.00,
             "initialStockQuantity":50,
             "lowStockThreshold":10
          }
       ]
    },
    {
       "sku":"LODGE-CASTIRON-12IN",
       "name":"Lodge 12-Inch Cast Iron Skillet",
       "description":"Pre-seasoned cast iron skillet for versatile cooking on any heat source.",
       "isActive":true,
       "categorySlugs":[
          "ustensiles-cuisine"
       ],
       "images":[
          {
             "imageUrl":"https://www.lodgecastiron.com/cdn/shop/files/lms3_td.jpg?v=1742483061&width=900",
             "altText":"Lodge Cast Iron Skillet top view",
             "isPrimary":false,
             "order":4
          },
          {
             "imageUrl":"https://www.lodgecastiron.com/cdn/shop/files/LMS3-Profile.jpg?v=1741188755&width=900",
             "altText":"Lodge Cast Iron Skillet on a stove",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://www.lodgecastiron.com/cdn/shop/files/jQrrFRuK.jpg?v=1734125010&width=900",
             "altText":"Lodge Cast Iron Skillet handle detail",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://www.lodgecastiron.com/cdn/shop/files/cbVg_hBw.jpg?v=1742328297&width=900",
             "altText":"Food cooking in Lodge Cast Iron Skillet",
             "isPrimary":true,
             "order":1
          }
       ],
       "variants":[
          {
             "attributes":{
                "Size":"12-Inch"
             },
             "price":29.99,
             "costPrice":18.00,
             "initialStockQuantity":200,
             "lowStockThreshold":30
          },
          {
             "attributes":{
                "Size":"10.25-Inch"
             },
             "price":21.99,
             "costPrice":13.00,
             "initialStockQuantity":250,
             "lowStockThreshold":35
          },
          {
             "attributes":{
                "Size":"8-Inch"
             },
             "price":14.99,
             "costPrice":9.00,
             "initialStockQuantity":300,
             "lowStockThreshold":40
          }
       ]
    },
    {
       "sku":"OXO-GOODGRIPS-PEELER",
       "name":"OXO Good Grips Swivel Peeler",
       "description":"Ergonomic and sharp peeler for effortlessly peeling fruits and vegetables.",
       "isActive":true,
       "categorySlugs":[
          "ustensiles-cuisine"
       ],
       "images":[
          {
             "imageUrl":"https://www.oxo.com/media/catalog/product/cache/40c19521a82b2b8a3ae810231e6e32e2/g/g/gg_20081v5_solo.jpg",
             "altText":"OXO Good Grips Swivel Peeler",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://www.oxo.com/media/catalog/product/cache/40c19521a82b2b8a3ae810231e6e32e2/g/g/gg_20081_8a.jpg",
             "altText":"OXO Peeler in hand",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://www.oxo.com/media/catalog/product/cache/40c19521a82b2b8a3ae810231e6e32e2/g/g/gg_20081_8b.jpg",
             "altText":"OXO Peeler peeling a potato",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://www.oxo.com/media/catalog/product/cache/40c19521a82b2b8a3ae810231e6e32e2/g/g/gg_20081_8c.jpg",
             "altText":"OXO Peeler blade detail",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Handle":"Non-slip"
             },
             "price":10.99,
             "costPrice":5.50,
             "initialStockQuantity":500,
             "lowStockThreshold":50
          }
       ]
    },
    {
       "sku":"INSTAPOT-DUO-6QT",
       "name":"Instant Pot Duo 6-Quart",
       "description":"7-in-1 electric pressure cooker, slow cooker, rice cooker, and more.",
       "isActive":true,
       "categorySlugs":[
          "ustensiles-cuisine"
       ],
       "images":[
          {
             "imageUrl":"https://instantpot.com/cdn/shop/files/113-1066-01_RIO_Wide_Silo.png?v=1748880477&width=750",
             "altText":"Instant Pot Duo front view",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://instantpot.com/cdn/shop/products/IB_113-1066-01_RIO-Wide-Base_ATF_Square_Tile2.jpg?v=1748880477&width=750",
             "altText":"Instant Pot Duo control panel",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://instantpot.com/cdn/shop/products/IB_113-1066-01_RIO-Wide-Base_ATF_Square_Tile3.jpg?v=1748880477&width=750",
             "altText":"Instant Pot Duo inner pot",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://instantpot.com/cdn/shop/products/IB_113-1066-01_RIO-Wide-Base_ATF_Square_Tile6.jpg?v=1748880477&width=750",
             "altText":"Instant Pot Duo with lid open",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Size":"6-Quart"
             },
             "price":89.99,
             "costPrice":60.00,
             "initialStockQuantity":60,
             "lowStockThreshold":10
          },
          {
             "attributes":{
                "Size":"8-Quart"
             },
             "price":109.99,
             "costPrice":75.00,
             "initialStockQuantity":40,
             "lowStockThreshold":8
          },
          {
             "attributes":{
                "Size":"3-Quart"
             },
             "price":79.99,
             "costPrice":55.00,
             "initialStockQuantity":50,
             "lowStockThreshold":10
          }
       ]
    },
    {
       "sku":"PYREX-MEASURE-CUP-SET",
       "name":"Pyrex Glass Measuring Cup Set",
       "description":"Durable 3-piece glass measuring cup set (1-cup, 2-cup, 4-cup).",
       "isActive":true,
       "categorySlugs":[
          "ustensiles-cuisine"
       ],
       "images":[
          {
             "imageUrl":"https://pyrexhome.com/cdn/shop/files/pyr_3pc_measuring_cup_set_1118990_5.jpg?v=1738688171&width=500",
             "altText":"Pyrex measuring cups set",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://pyrexhome.com/cdn/shop/files/PY_Brand-Claim_Prepware_B_941d5206-8416-4b7c-b6a4-7919d8ec8853.jpg?v=1738688171&width=1125",
             "altText":"Pyrex 2-cup measuring cup",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://pyrexhome.com/cdn/shop/files/PY_Americas-number-1_Benefit-Tile_Square_5fd14796-dc2e-47d3-9429-d35659af68ef.jpg?v=1738688171&width=1125",
             "altText":"Pyrex measuring cups stacked",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://pyrexhome.com/cdn/shop/files/PY_The-brand-you-trust_Benefit-Tile_Square_0c03ef24-349c-4ce5-96b6-4b100525ede2.jpg?v=1738688171&width=1125",
             "altText":"Liquid in Pyrex measuring cup",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Count":"3-Piece Set"
             },
             "price":19.99,
             "costPrice":12.00,
             "initialStockQuantity":120,
             "lowStockThreshold":20
          }
       ]
    },
    {
       "sku":"CERAVE-MOIST-CRM",
       "name":"CeraVe Moisturizing Cream",
       "description":"A rich, non-greasy moisturizing cream for normal to dry skin with ceramides.",
       "isActive":true,
       "categorySlugs":[
          "soins-peau"
       ],
       "images":[
          {
             "imageUrl":"https://www.cerave.fr/-/media/project/loreal/brand-sites/cerave/emea/fr/fr-all-product-details-latest/new-pdp-images/crme-hydratante-visage/700-x-875px/creme-hydratante-visage-pm--packshot-front.png?rev=-1?w=500&hash=18116BA5B431E76CBBA3489D8B0A64D9",
             "altText":"CeraVe Moisturizing Cream tub",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://www.cerave.fr/-/media/project/loreal/brand-sites/cerave/emea/fr/fr-all-product-details-latest/new-pdp-images/crme-hydratante-visage/700-x-875px/creme-hydratante-visage-3-benefices.jpg?rev=-1?w=500&hash=E33B33BBCCD3291407DA3AACEB8E37C3",
             "altText":"CeraVe Moisturizing Cream texture",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://www.cerave.fr/-/media/project/loreal/brand-sites/cerave/emea/fr/fr-all-product-details-latest/new-pdp-images/crme-hydratante-visage/700-x-875px/creme-hydratante-visage---texture-benefices.jpg?rev=-1?w=500&hash=7E89ACEE0BF46FC621FBF1D0CEE5883B",
             "altText":"CeraVe Moisturizing Cream ingredients list",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://www.cerave.fr/-/media/project/loreal/brand-sites/cerave/emea/fr/fr-all-product-details-latest/new-pdp-images/crme-hydratante-visage/700-x-875px/creme-hydratante-visage-ceramides.jpg?rev=-1?w=500&hash=2BF76C7FC8E13B48627310659EE5E235",
             "altText":"CeraVe Moisturizing Cream being applied",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Size":"19 oz"
             },
             "price":17.99,
             "costPrice":11.00,
             "initialStockQuantity":100,
             "lowStockThreshold":15
          },
          {
             "attributes":{
                "Size":"16 oz with Pump"
             },
             "price":18.99,
             "costPrice":11.50,
             "initialStockQuantity":80,
             "lowStockThreshold":15
          }
       ]
    },
    {
       "sku":"LAROCHE-HYDRATING-CLEANSER",
       "name":"La Roche-Posay Hydrating Gentle Cleanser",
       "description":"A gentle face wash for normal to dry, sensitive skin. Soap-free and fragrance-free.",
       "isActive":true,
       "categorySlugs":[
          "soins-peau"
       ],
       "images":[
          {
             "imageUrl":"https://www.laroche-posay.us/dw/image/v2/AANG_PRD/on/demandware.static/-/Sites-acd-laroche-posay-master-catalog/default/dw8b2f3571/product/March%202023%20packshot%20updates/Toleriane_HydratingGentleCleanser_400ml-Pump.jpg?sw=720&sh=720&sm=cut&sfrm=jpg&q=70",
             "altText":"La Roche-Posay Hydrating Gentle Cleanser bottle",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://www.laroche-posay.us/dw/image/v2/AANG_PRD/on/demandware.static/-/Sites-acd-laroche-posay-master-catalog/default/dwd45fdf9b/img/tolerianehydratinggentlefacialcleanser/02_La-Roche-Posay_TolerianeHydrating-Cleanser_refill_ingredient_1500x1500-REV.jpg?sw=720&sh=720&sm=cut&sfrm=jpg&q=70",
             "altText":"Cleanser pump dispenser",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://www.laroche-posay.us/dw/image/v2/AANG_PRD/on/demandware.static/-/Sites-acd-laroche-posay-master-catalog/default/dw91ca27b3/img/tolerianehydratinggentlefacialcleanser/LaRochePosay-Product-Toleriane-Hydrating-Gentle-Cleanser-ATFTexture-REV-1500x1500.jpg?sw=720&sh=720&sm=cut&sfrm=jpg&q=70",
             "altText":"Cleanser texture on hand",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://www.laroche-posay.us/dw/image/v2/AANG_PRD/on/demandware.static/-/Sites-acd-laroche-posay-master-catalog/default/dwe2231ae5/img/tolerianehydratinggentlefacialcleanser/007%20Update/LaRochePosay-Product-TolerianeHGCroutine.jpg?sw=720&sh=720&sm=cut&sfrm=jpg&q=70",
             "altText":"Back of the cleanser bottle",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Size":"13.52 fl oz"
             },
             "price":16.99,
             "costPrice":10.50,
             "initialStockQuantity":90,
             "lowStockThreshold":15
          },
          {
             "attributes":{
                "Size":"6.76 fl oz"
             },
             "price":12.99,
             "costPrice":7.50,
             "initialStockQuantity":110,
             "lowStockThreshold":20
          }
       ]
    },
    {
       "sku":"SUPERGOOP-UNSEEN-SPF40",
       "name":"Supergoop! Unseen Sunscreen SPF 40",
       "description":"An invisible, weightless, and scentless daily sunscreen that works as a primer.",
       "isActive":true,
       "categorySlugs":[
          "soins-peau"
       ],
       "images":[
          {
             "imageUrl":"https://supergoop.com/cdn/shop/files/supergoop-unseen-sunscreen-spf-50-product-and-texture.jpg?v=1736790818&width=640",
             "altText":"Supergoop Unseen Sunscreen tube",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://supergoop.com/cdn/shop/files/supergoop-unseen-sunscreen-spf-50-model-with-benefits-and-texture-on-face.jpg?v=1748622691&width=640",
             "altText":"Unseen Sunscreen gel texture",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://supergoop.com/cdn/shop/files/supergoop-unseen-sunscreen-spf-50-product-and-benefits-list.jpg?v=1748622691&width=640",
             "altText":"Unseen Sunscreen applied to skin",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://supergoop.com/cdn/shop/files/supergoop-unseen-sunscreen-spf-50-product-and-texture-with-ingredients.png?v=1748622691&width=640",
             "altText":"Unseen Sunscreen packaging box",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Size":"1.7 oz"
             },
             "price":38.00,
             "costPrice":24.00,
             "initialStockQuantity":70,
             "lowStockThreshold":10
          },
          {
             "attributes":{
                "Size":"2.5 oz (Jumbo)"
             },
             "price":48.00,
             "costPrice":30.00,
             "initialStockQuantity":40,
             "lowStockThreshold":8
          }
       ]
    },
    {
       "sku":"LEVIS-501-JEAN-M",
       "name":"Levi's 501 Original Fit Men's Jeans",
       "description":"The timeless, original blue jean with a classic straight leg and button fly.",
       "isActive":true,
       "categorySlugs":[
          "vetements-homme"
       ],
       "images":[
          {
             "imageUrl":"https://lsco.scene7.com/is/image/lsco/005013662-detail1-pdp?fmt=webp&qlt=70&resMode=sharp2&fit=crop,1&op_usm=0.6,0.6,8&wid=660&hei=660",
             "altText":"Levi's 501 jeans front",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://lsco.scene7.com/is/image/lsco/005013662-back-pdp?fmt=webp&qlt=70&resMode=sharp2&fit=crop,1&op_usm=0.6,0.6,8&wid=660&hei=660",
             "altText":"Levi's 501 jeans back",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://lsco.scene7.com/is/image/lsco/005013662-side-pdp?fmt=webp&qlt=70&resMode=sharp2&fit=crop,1&op_usm=0.6,0.6,8&wid=660&hei=660",
             "altText":"Levi's 501 button fly detail",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://lsco.scene7.com/is/image/lsco/005013662-front-pdp?fmt=webp&qlt=70&resMode=sharp2&fit=crop,1&op_usm=0.6,0.6,8&wid=660&hei=660",
             "altText":"Levi's 501 leather patch detail",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Color":"Stonewash",
                "colorHex":"#89abcd",
                "Size":"32x32"
             },
             "price":69.50,
             "costPrice":35.00,
             "initialStockQuantity":80,
             "lowStockThreshold":10
          },
          {
             "attributes":{
                "Color":"Stonewash",
                "colorHex":"#89abcd",
                "Size":"34x32"
             },
             "price":69.50,
             "costPrice":35.00,
             "initialStockQuantity":75,
             "lowStockThreshold":10
          },
          {
             "attributes":{
                "Color":"Dark Stonewash",
                "colorHex":"#547e9a",
                "Size":"32x32"
             },
             "price":69.50,
             "costPrice":35.00,
             "initialStockQuantity":60,
             "lowStockThreshold":8
          }
       ]
    },
    {
       "sku":"CARHARTT-K87-TSHIRT-M",
       "name":"Carhartt K87 Workwear T-Shirt",
       "description":"A durable, heavyweight cotton t-shirt with a chest pocket and a roomy fit.",
       "isActive":true,
       "categorySlugs":[
          "vetements-homme"
       ],
       "images":[
          {
             "imageUrl":"https://dungarees.com/images/products/carhartt/product/image-K87BLK-550-550.jpg",
             "altText":"Carhartt K87 T-Shirt front view",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://dungarees.com/images/products/carhartt/alternate/image-9951K87-550-550.jpg",
             "altText":"Carhartt K87 T-Shirt pocket detail",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://dungarees.com/images/products/carhartt/alternate/image-6057K87-alternate-2-550-550.jpg",
             "altText":"Carhartt K87 T-Shirt collar detail",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://dungarees.com/images/products/carhartt/alternate/image-5747K87-alternate-550-550.jpg",
             "altText":"Carhartt K87 T-Shirt folded",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Color":"Heather Grey",
                "colorHex":"#b2b2b2",
                "Size":"Large"
             },
             "price":19.99,
             "costPrice":10.00,
             "initialStockQuantity":250,
             "lowStockThreshold":30
          },
          {
             "attributes":{
                "Color":"Black",
                "colorHex":"#000000",
                "Size":"Large"
             },
             "price":19.99,
             "costPrice":10.00,
             "initialStockQuantity":300,
             "lowStockThreshold":30
          },
          {
             "attributes":{
                "Color":"Navy",
                "colorHex":"#000080",
                "Size":"Medium"
             },
             "price":19.99,
             "costPrice":10.00,
             "initialStockQuantity":200,
             "lowStockThreshold":25
          }
       ]
    },
    {
       "sku":"CHAMPION-HOODIE-M",
       "name":"Champion Reverse Weave Hoodie",
       "description":"A classic, heavyweight fleece hoodie that resists vertical shrinkage.",
       "isActive":true,
       "categorySlugs":[
          "vetements-homme"
       ],
       "images":[
          {
             "imageUrl":"https://www.championstore.com/cdn/shop/files/CHPEU_221168_KK001_Full_Alt1_482c86b0-2e1a-4106-b2f5-2106809d7c00.jpg?v=1746783765&width=1200",
             "altText":"Champion Reverse Weave Hoodie front",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://www.championstore.com/cdn/shop/files/CHPEU_221168_KK001_Full_Alt2.jpg?v=1746783765&width=1200",
             "altText":"Champion Reverse Weave Hoodie hood detail",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://www.championstore.com/cdn/shop/files/CHPEU_221168_KK001_Full_Front_1e636115-30b2-4fe6-acc7-0c856386416d.jpg?v=1746783765&width=1200",
             "altText":"Champion logo on sleeve",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://www.championstore.com/cdn/shop/files/CHPEU_221168_KK001_Full_Crop_a99b528d-97d4-4109-a709-c1de99a6a7df.jpg?v=1746783765&width=1200",
             "altText":"Champion Reverse Weave Hoodie side panel",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Color":"Oxford Gray",
                "colorHex":"#4d4d4f",
                "Size":"Large"
             },
             "price":65.00,
             "costPrice":32.00,
             "initialStockQuantity":90,
             "lowStockThreshold":10
          },
          {
             "attributes":{
                "Color":"Black",
                "colorHex":"#000000",
                "Size":"Medium"
             },
             "price":65.00,
             "costPrice":32.00,
             "initialStockQuantity":100,
             "lowStockThreshold":12
          },
          {
             "attributes":{
                "Color":"Navy",
                "colorHex":"#000080",
                "Size":"Large"
             },
             "price":65.00,
             "costPrice":32.00,
             "initialStockQuantity":80,
             "lowStockThreshold":10
          }
       ]
    },
    {
       "sku":"LEGO-STARWARS-XWING-75355",
       "name":"LEGO Star Wars X-Wing Starfighter",
       "description":"Highly detailed Ultimate Collector Series version of the iconic X-Wing Starfighter.",
       "isActive":true,
       "categorySlugs":[
          "jouets-educatifs"
       ],
       "images":[
          {
             "imageUrl":"https://www.lego.com/cdn/cs/set/assets/blt3e07af4c83a87efd/75355.png?format=webply&fit=bounds&quality=75&width=800&height=800&dpr=1",
             "altText":"LEGO X-Wing Starfighter model",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://www.lego.com/cdn/cs/set/assets/bltec62b553a047fa14/75355_alt1.png?format=webply&fit=bounds&quality=75&width=800&height=800&dpr=1",
             "altText":"LEGO X-Wing cockpit detail",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://www.lego.com/cdn/cs/set/assets/blt114953c776ac3457/75355_alt2.png?format=webply&fit=bounds&quality=75&width=800&height=800&dpr=1",
             "altText":"LEGO X-Wing with display stand",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://www.lego.com/cdn/cs/set/assets/bltb9e5d66f3df6e0bd/75355_alt3.png?format=webply&fit=bounds&quality=75&width=800&height=800&dpr=1",
             "altText":"LEGO X-Wing box art",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Set Number":"75355",
                "Pieces":"1949"
             },
             "price":239.99,
             "costPrice":170.00,
             "initialStockQuantity":20,
             "lowStockThreshold":4
          }
       ]
    },
    {
       "sku":"RAVENS-PUZZLE-1000PC",
       "name":"Ravensburger 1000 Piece Jigsaw Puzzle",
       "description":"A high-quality 1000-piece puzzle with Softclick technology for a perfect fit.",
       "isActive":true,
       "categorySlugs":[
          "jeux-societe"
       ],
       "images":[
          {
             "imageUrl":"https://ravensburger.cloud/images/product-cover/520x445/Tapis-de-puzzle-300-1500-pices-17956.webp",
             "altText":"Ravensburger puzzle box",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://ravensburger.cloud/images/produktseiten/520x445/17956_2.webp",
             "altText":"Completed Ravensburger puzzle",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://ravensburger.cloud/images/produktseiten/520x445/17956_3.webp",
             "altText":"Ravensburger puzzle pieces",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://ravensburger.cloud/images/produktseiten/520x445/17956_1.webp",
             "altText":"Corner pieces of puzzle",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Theme":"Mountain Landscape"
             },
             "price":21.99,
             "costPrice":12.00,
             "initialStockQuantity":80,
             "lowStockThreshold":10
          },
          {
             "attributes":{
                "Theme":"Starry Night"
             },
             "price":21.99,
             "costPrice":12.00,
             "initialStockQuantity":75,
             "lowStockThreshold":10
          },
          {
             "attributes":{
                "Theme":"World Map"
             },
             "price":21.99,
             "costPrice":12.00,
             "initialStockQuantity":60,
             "lowStockThreshold":8
          }
       ]
    },
    {
       "sku":"CATAN-BOARD-GAME",
       "name":"Catan Board Game",
       "description":"The classic strategy board game of trade, building, and settlement.",
       "isActive":true,
       "categorySlugs":[
          "jeux-societe"
       ],
       "images":[
          {
             "imageUrl":"https://media.istockphoto.com/id/458619641/photo/settlers-of-catan-game-board.jpg?s=612x612&w=0&k=20&c=w7ZHStKJ1UBfqck5v3dV5mEUS5gp6aASk5_6F613wl4=",
             "altText":"Catan board game box",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://media.istockphoto.com/id/522875360/photo/house-buying-dangers.jpg?s=612x612&w=0&k=20&c=GONKJ4Hj1NMC1BDRSGly2ngOYxJYue5ek0b9BFEonj4=",
             "altText":"Catan game setup on table",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://media.istockphoto.com/id/458710095/photo/the-settlers-of-catan.jpg?s=612x612&w=0&k=20&c=YoHZSmc6CcUIzkm91T5Lmk2oGEb9mkBYZE9QY-4fJeA=",
             "altText":"Catan game pieces (settlements, roads)",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://media.istockphoto.com/id/458619649/photo/settlers-of-catan-game.jpg?s=612x612&w=0&k=20&c=I2bPlCf6EWPqQLIVy5uDX7QOYJ4IeOkIwItPDsI7Il4=",
             "altText":"Catan resource cards",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Players":"3-4",
                "Edition":"Base Game"
             },
             "price":49.99,
             "costPrice":28.00,
             "initialStockQuantity":100,
             "lowStockThreshold":15
          }
       ]
    },
    {
       "sku":"TICKET-TO-RIDE-GAME",
       "name":"Ticket to Ride Board Game",
       "description":"A cross-country train adventure where players collect and play matching train cards to claim railway routes.",
       "isActive":true,
       "categorySlugs":[
          "jeux-societe"
       ],
       "images":[
          {
             "imageUrl":"https://cf.geekdo-images.com/ZWJg0dCdrWHxVnc0eFXK8w__imagepage/img/FcSGmLeIStNfb0l_qKSuOyz-rHY=/fit-in/900x600/filters:no_upscale():strip_icc()/pic38668.jpg",
             "altText":"Ticket to Ride game box",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://cf.geekdo-images.com/U2eaeOCVGYFDhPgaIY6CmQ__imagepage/img/NbwT-0PsXiT0M4VkoLBP7wX1Zuk=/fit-in/900x600/filters:no_upscale():strip_icc()/pic38674.jpg",
             "altText":"Ticket to Ride game board (USA map)",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://cf.geekdo-images.com/xDH6l0dyn66jedcCK8sJ5w__imagepage/img/9EZvmWYVo_PRg8NFUwrrO9ah5xY=/fit-in/900x600/filters:no_upscale():strip_icc()/pic38676.jpg",
             "altText":"Ticket to Ride train cars and cards",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://cf.geekdo-images.com/b7IeTmGDbfQsogyQIETvGw__imagepage/img/VfAlEZWB3Ig0_TiEbDD9-XiHk0k=/fit-in/900x600/filters:no_upscale():strip_icc()/pic43019.jpg",
             "altText":"Players playing Ticket to Ride",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Players":"2-5",
                "Edition":"USA"
             },
             "price":54.99,
             "costPrice":30.00,
             "initialStockQuantity":70,
             "lowStockThreshold":10
          }
       ]
    },
    {
       "sku":"OSPREY-ATMOS-AG-65",
       "name":"Osprey Atmos AG 65 Backpack",
       "description":"A revolutionary backpacking pack with Anti-Gravity suspension for outstanding comfort and ventilation.",
       "isActive":true,
       "categorySlugs":[
          "materiel-camping",
          "sacs"
       ],
       "images":[
          {
             "imageUrl":"https://m.media-amazon.com/images/I/81+WAMxuWtL._AC_SY550_.jpg",
             "altText":"Osprey Atmos AG 65 backpack front",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://m.media-amazon.com/images/I/71evv6bK1HL._AC_SX522_.jpg",
             "altText":"Osprey Atmos AG 65 back with suspension system",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://m.media-amazon.com/images/I/71k9L1mwMEL._AC_SX522_.jpg",
             "altText":"Osprey Atmos AG 65 hipbelt detail",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://m.media-amazon.com/images/I/712OPxTJ8oL._AC_SX522_.jpg",
             "altText":"Osprey Atmos AG 65 top lid",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Color":"Mythical Green",
                "colorHex":"#2a5743",
                "Size":"Large"
             },
             "price":299.95,
             "costPrice":190.00,
             "initialStockQuantity":25,
             "lowStockThreshold":5
          },
          {
             "attributes":{
                "Color":"Mythical Green",
                "colorHex":"#2a5743",
                "Size":"Medium"
             },
             "price":299.95,
             "costPrice":190.00,
             "initialStockQuantity":30,
             "lowStockThreshold":5
          },
          {
             "attributes":{
                "Color":"Black",
                "colorHex":"#000000",
                "Size":"Large"
             },
             "price":299.95,
             "costPrice":190.00,
             "initialStockQuantity":20,
             "lowStockThreshold":4
          }
       ]
    },
    {
       "sku":"MSR-POCKETROCKET-2",
       "name":"MSR PocketRocket 2 Stove",
       "description":"An ultralight, compact, and fast-boiling canister stove for minimalist backpackers.",
       "isActive":true,
       "categorySlugs":[
          "materiel-camping"
       ],
       "images":[
          {
             "imageUrl":"https://m.media-amazon.com/images/I/614igqEmrxL._AC_SX679_.jpg",
             "altText":"MSR PocketRocket 2 stove",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://m.media-amazon.com/images/I/61hgAOjV5GL._AC_SX679_.jpg",
             "altText":"MSR PocketRocket 2 stove attached to fuel canister",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://m.media-amazon.com/images/I/61+0PlZvHHL._AC_SX679_.jpg",
             "altText":"MSR PocketRocket 2 stove with pot supports open",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://m.media-amazon.com/images/I/61dy3DcKBcL._AC_SX679_.jpg",
             "altText":"MSR PocketRocket 2 stove in its case",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Weight":"2.6 oz"
             },
             "price":49.95,
             "costPrice":30.00,
             "initialStockQuantity":120,
             "lowStockThreshold":20
          }
       ]
    },
    {
       "sku":"THERMAREST-Z-LITE-SOL",
       "name":"Therm-a-Rest Z Lite Sol Sleeping Pad",
       "description":"A compact and durable closed-cell foam sleeping pad with a reflective coating to boost warmth.",
       "isActive":true,
       "categorySlugs":[
          "materiel-camping"
       ],
       "images":[
          {
             "imageUrl":"https://cascadedesigns.com/cdn/shop/files/06670_tr_zlite_sol_limonsilver_regular_silver_angle_fold.jpg?v=1728427656&width=493",
             "altText":"Therm-a-Rest Z Lite Sol sleeping pad unfolded",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://cascadedesigns.com/cdn/shop/files/13267_thermarest_zlite_blue_regular_top.jpg?v=1724820296&width=493",
             "altText":"Therm-a-Rest Z Lite Sol folded accordion-style",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://cascadedesigns.com/cdn/shop/files/06679_tr_zlitesol_limon_reg_folded.jpg?v=1728427641&width=493",
             "altText":"Texture of Z Lite Sol sleeping pad",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://cascadedesigns.com/cdn/shop/files/tr_lifestyle_zlitesol_5.jpg?v=1729284452&width=493",
             "altText":"Z Lite Sol sleeping pad in use with sleeping bag",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Size":"Regular"
             },
             "price":54.95,
             "costPrice":32.00,
             "initialStockQuantity":90,
             "lowStockThreshold":15
          },
          {
             "attributes":{
                "Size":"Short"
             },
             "price":44.95,
             "costPrice":26.00,
             "initialStockQuantity":50,
             "lowStockThreshold":10
          }
       ]
    },
    {
       "sku":"MOLESKINE-CLASSIC-L",
       "name":"Moleskine Classic Notebook, Large, Ruled",
       "description":"The legendary notebook used by artists and thinkers. Hard cover, ruled pages.",
       "isActive":true,
       "categorySlugs":[
          "fournitures-scolaires"
       ],
       "images":[
          {
             "imageUrl":"https://www.moleskine.com/dw/image/v2/BFRN_PRD/on/demandware.static/-/Sites-masterCatalog_Moleskine/default/dw2791c398/images/large-PDP/gtin_9788883701122_01.png?sh=1100",
             "altText":"Moleskine Classic Notebook front",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://www.moleskine.com/dw/image/v2/BFRN_PRD/on/demandware.static/-/Sites-masterCatalog_Moleskine/default/dw491310ea/images/large-PDP/gtin_9788883701122_02.png?sh=1100",
             "altText":"Moleskine notebook open to ruled pages",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://www.moleskine.com/dw/image/v2/BFRN_PRD/on/demandware.static/-/Sites-masterCatalog_Moleskine/default/dwff87f8d1/images/large-PDP/gtin_9788883701122_04.png?sh=1100",
             "altText":"Moleskine notebook elastic closure",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://www.moleskine.com/dw/image/v2/BFRN_PRD/on/demandware.static/-/Sites-masterCatalog_Moleskine/default/dw09dfbad6/images/large-PDP/gtin_9788883701122_06.png?sh=1100",
             "altText":"Moleskine notebook back pocket detail",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Color":"Black",
                "colorHex":"#000000",
                "Size":"Large (5x8.25 in)",
                "Layout":"Ruled"
             },
             "price":22.95,
             "costPrice":12.00,
             "initialStockQuantity":300,
             "lowStockThreshold":40
          },
          {
             "attributes":{
                "Color":"Black",
                "colorHex":"#000000",
                "Size":"Large (5x8.25 in)",
                "Layout":"Plain"
             },
             "price":22.95,
             "costPrice":12.00,
             "initialStockQuantity":150,
             "lowStockThreshold":20
          },
          {
             "attributes":{
                "Color":"Sapphire Blue",
                "colorHex":"#0f52ba",
                "Size":"Large (5x8.25 in)",
                "Layout":"Ruled"
             },
             "price":22.95,
             "costPrice":12.00,
             "initialStockQuantity":100,
             "lowStockThreshold":15
          }
       ]
    },
    {
       "sku":"PILOT-G2-PEN-BLK-12",
       "name":"Pilot G2 Premium Gel Roller Pens, Black (12-Pack)",
       "description":"The top-selling retractable gel pen in America. Smooth writing and comfortable grip.",
       "isActive":true,
       "categorySlugs":[
          "fournitures-scolaires"
       ],
       "images":[
          {
             "imageUrl":"https://m.media-amazon.com/images/I/61loFozj1CL._AC_SX679_.jpg",
             "altText":"Pack of 12 Pilot G2 pens",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://m.media-amazon.com/images/I/61RVdrD342L._AC_SX425_.jpg",
             "altText":"Single Pilot G2 pen",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://m.media-amazon.com/images/I/51BHyA-r6FS._AC_SY450_.jpg",
             "altText":"Pilot G2 pen tip detail",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://m.media-amazon.com/images/I/71+IKWqrxdS._AC_SX425_.jpg",
             "altText":"Handwriting sample from Pilot G2 pen",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Point Size":"0.7mm (Fine)",
                "Color":"Black",
                "colorHex":"#000000"
             },
             "price":14.99,
             "costPrice":8.00,
             "initialStockQuantity":500,
             "lowStockThreshold":50
          },
          {
             "attributes":{
                "Point Size":"0.5mm (Extra Fine)",
                "Color":"Black",
                "colorHex":"#000000"
             },
             "price":14.99,
             "costPrice":8.00,
             "initialStockQuantity":300,
             "lowStockThreshold":40
          },
          {
             "attributes":{
                "Point Size":"0.7mm (Fine)",
                "Color":"Blue",
                "colorHex":"#0000FF"
             },
             "price":14.99,
             "costPrice":8.00,
             "initialStockQuantity":400,
             "lowStockThreshold":50
          }
       ]
    },
    {
       "sku":"STAEDTLER-PENCIL-SET",
       "name":"Staedtler Mars Lumograph Drawing Pencils (Set of 12)",
       "description":"High-quality drawing pencils in a range of hardness grades for artists and designers.",
       "isActive":true,
       "categorySlugs":[
          "materiel-art"
       ],
       "images":[
          {
             "imageUrl":"https://m.media-amazon.com/images/I/81gj-mPKNwL.__AC_SX300_SY300_QL70_FMwebp_.jpg",
             "altText":"Staedtler drawing pencils in tin case",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://m.media-amazon.com/images/I/61BLKEo3b1L._AC_SX425_.jpg",
             "altText":"Close-up of Staedtler pencil tips",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://m.media-amazon.com/images/I/91y2307TlLL._AC_SX425_.jpg",
             "altText":"A sketch made with Staedtler pencils",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://m.media-amazon.com/images/I/41vTfFMBkIL._AC_SX425_.jpg",
             "altText":"Single Staedtler pencil",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Grades":"6B-4H",
                "Set Size":"12"
             },
             "price":15.99,
             "costPrice":9.00,
             "initialStockQuantity":150,
             "lowStockThreshold":20
          }
       ]
    },
    {
       "sku":"CANSON-XL-SKETCHBOOK",
       "name":"Canson XL Series Sketch Pad",
       "description":"A wire-bound sketch pad with smooth, acid-free paper, perfect for sketching and drawing.",
       "isActive":true,
       "categorySlugs":[
          "materiel-art"
       ],
       "images":[
          {
             "imageUrl":"https://m.media-amazon.com/images/I/81jTVQ4w4tL._AC_SX679_.jpg",
             "altText":"Canson XL Sketch Pad cover",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://m.media-amazon.com/images/I/71+SFIXPy4L._AC_SX679_.jpg",
             "altText":"Canson XL Sketch Pad open to a blank page",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://m.media-amazon.com/images/I/81zEqwPb84L._AC_SX679_.jpg",
             "altText":"Canson XL Sketch Pad wire binding detail",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://m.media-amazon.com/images/I/81ki2VxAnxL._AC_SX679_.jpg",
             "altText":"Drawing on a page of the Canson sketch pad",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Size":"9x12 inches",
                "Sheets":"100"
             },
             "price":12.49,
             "costPrice":7.00,
             "initialStockQuantity":200,
             "lowStockThreshold":30
          },
          {
             "attributes":{
                "Size":"5.5x8.5 inches",
                "Sheets":"100"
             },
             "price":8.99,
             "costPrice":5.00,
             "initialStockQuantity":250,
             "lowStockThreshold":35
          }
       ]
    },
    {
       "sku":"TI-84-PLUS-CE-CALC",
       "name":"Texas Instruments TI-84 Plus CE Graphing Calculator",
       "description":"A powerful graphing calculator with a full-color display, ideal for high school and college math.",
       "isActive":true,
       "categorySlugs":[
          "fournitures-scolaires"
       ],
       "images":[
          {
             "imageUrl":"https://m.media-amazon.com/images/I/71LgDN3WrpL._AC_SY879_.jpg",
             "altText":"TI-84 Plus CE calculator front view",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://m.media-amazon.com/images/I/71rilTfU+xL._AC_SY879_.jpg",
             "altText":"TI-84 Plus CE color screen displaying a graph",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://m.media-amazon.com/images/I/71OxB8zMtgL._AC_SX425_.jpg",
             "altText":"TI-84 Plus CE keyboard layout",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://m.media-amazon.com/images/I/71ll6UbRFqL._AC_SX425_.jpg",
             "altText":"TI-84 Plus CE with its slide cover",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Color":"Black",
                "colorHex":"#000000"
             },
             "price":129.99,
             "costPrice":95.00,
             "initialStockQuantity":50,
             "lowStockThreshold":10
          },
          {
             "attributes":{
                "Color":"Radical Red",
                "colorHex":"#ff355e"
             },
             "price":129.99,
             "costPrice":95.00,
             "initialStockQuantity":30,
             "lowStockThreshold":5
          },
          {
             "attributes":{
                "Color":"Rose Gold",
                "colorHex":"#b76e79"
             },
             "price":134.99,
             "costPrice":98.00,
             "initialStockQuantity":25,
             "lowStockThreshold":5
          }
       ]
    },
    {
       "sku":"POST-IT-NOTES-3X3-YLW",
       "name":"Post-it Notes, 3x3, Canary Yellow",
       "description":"The classic sticky notes for reminders and short messages. 12 pads per pack.",
       "isActive":true,
       "categorySlugs":[
          "fournitures-scolaires"
       ],
       "images":[
          {
             "imageUrl":"https://m.media-amazon.com/images/I/71zhzeZ2s9L._AC_SX425_.jpg",
             "altText":"Pack of Post-it Notes",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://m.media-amazon.com/images/I/71YJTxNI72L._AC_SX425_.jpg",
             "altText":"A single pad of Post-it Notes",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://m.media-amazon.com/images/I/71+3+HzvTmL._AC_SX425_.jpg",
             "altText":"A Post-it Note on a monitor",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://m.media-amazon.com/images/I/81YxTvbOZTL._AC_SX425_.jpg",
             "altText":"Stack of Post-it Note pads",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Color":"Canary Yellow",
                "colorHex":"#ffff99",
                "Count":"12 Pads"
             },
             "price":13.99,
             "costPrice":7.50,
             "initialStockQuantity":400,
             "lowStockThreshold":50
          },
          {
             "attributes":{
                "Color":"Miami Collection",
                "colorHex":"#ff6f61",
                "Count":"12 Pads"
             },
             "price":14.99,
             "costPrice":8.00,
             "initialStockQuantity":300,
             "lowStockThreshold":40
          }
       ]
    },
    {
       "sku":"FJALLRAVEN-KANKEN-BP",
       "name":"Fjällräven Kånken Classic Backpack",
       "description":"An iconic and durable backpack made from Vinylon F fabric with a removable seat pad.",
       "isActive":true,
       "categorySlugs":[
          "sacs"
       ],
       "images":[
          {
             "imageUrl":"https://www.fjallraven.com/494751/globalassets/catalogs/fjallraven/f2/f235/f23510/f424/kanken_23510-424_a_main_fjr.jpg?width=624&height=624&rmode=BoxPad&bgcolor=fff&quality=100",
             "altText":"Fjällräven Kånken backpack front view",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://www.fjallraven.com/494751/globalassets/catalogs/fjallraven/f2/f235/f23510/f424/kanken_23510-424_b_main_fjr.jpg?width=624&height=624&rmode=BoxPad&bgcolor=fff&quality=100",
             "altText":"Fjällräven Kånken backpack side view",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://www.fjallraven.com/494751/globalassets/catalogs/fjallraven/f2/f235/f23510/f424/kanken_23510-424_f_main_fjr.jpg?width=624&height=624&rmode=BoxPad&bgcolor=fff&quality=100",
             "altText":"Fjällräven Kånken backpack logo detail",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://www.fjallraven.com/4916ef/globalassets/catalogs/fjallraven/f2/f235/f23510/features/kanken_23510-228_d_model_fjr.jpg?width=624&height=624&rmode=BoxPad&bgcolor=fff&quality=100",
             "altText":"Inside of Fjällräven Kånken backpack",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Color":"Graphite",
                "colorHex":"#383838"
             },
             "price":80.00,
             "costPrice":45.00,
             "initialStockQuantity":100,
             "lowStockThreshold":15
          },
          {
             "attributes":{
                "Color":"Ox Red",
                "colorHex":"#7a0019"
             },
             "price":80.00,
             "costPrice":45.00,
             "initialStockQuantity":80,
             "lowStockThreshold":12
          },
          {
             "attributes":{
                "Color":"Frost Green",
                "colorHex":"#8aa37b"
             },
             "price":80.00,
             "costPrice":45.00,
             "initialStockQuantity":90,
             "lowStockThreshold":15
          }
       ]
    },
    {
       "sku":"HERSCHEL-NOVEL-DUFFEL",
       "name":"Herschel Novel Duffle Bag",
       "description":"A classic duffle bag with a signature separate shoe compartment.",
       "isActive":true,
       "categorySlugs":[
          "sacs"
       ],
       "images":[
          {
             "imageUrl":"https://herschel.com/content/dam/herschel/products/11396/11396-00032-OS_01.jpg.sthumbnails.2000.2500.webp",
             "altText":"Herschel Novel Duffle Bag",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://herschel.com/content/dam/herschel/products/11396/11396-00032-OS_02.jpg.sthumbnails.2000.2500.webp",
             "altText":"Herschel Novel Duffle shoe compartment",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://herschel.com/content/dam/herschel/products/11396/11396-00032-OS_03.jpg.sthumbnails.2000.2500.webp",
             "altText":"Herschel Novel Duffle interior lining",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://herschel.com/content/dam/herschel/products/11396/11396-ALLCOLORS_05.jpg.sthumbnails.2000.2500.webp",
             "altText":"Herschel Novel Duffle shoulder strap",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Color":"Black",
                "colorHex":"#000000"
             },
             "price":99.99,
             "costPrice":55.00,
             "initialStockQuantity":60,
             "lowStockThreshold":10
          },
          {
             "attributes":{
                "Color":"Raven Crosshatch",
                "colorHex":"#696969"
             },
             "price":99.99,
             "costPrice":55.00,
             "initialStockQuantity":45,
             "lowStockThreshold":8
          },
          {
             "attributes":{
                "Color":"Navy/Tan",
                "colorHex":"#000080"
             },
             "price":99.99,
             "costPrice":55.00,
             "initialStockQuantity":50,
             "lowStockThreshold":10
          }
       ]
    },
    {
       "sku":"BELLROY-SLING-7L",
       "name":"Bellroy Sling 7L",
       "description":"A versatile and smartly designed sling bag for everyday essentials.",
       "isActive":true,
       "categorySlugs":[
          "sacs"
       ],
       "images":[
          {
             "imageUrl":"https://bellroy-product-images.imgix.net/bellroy_dot_com_gallery_image/USD/BLLA-ARG-233/0?auto=format&fit=crop&w=1500&h=1500",
             "altText":"Bellroy Sling front view",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://bellroy-product-images.imgix.net/bellroy_dot_com_gallery_image/USD/BLLA-ARG-233/1?auto=format&fit=crop&w=1500&h=1500",
             "altText":"Bellroy Sling being worn",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://bellroy-product-images.imgix.net/bellroy_dot_com_gallery_image/USD/BLLA-ARG-233/2?auto=format&fit=max&w=1500",
             "altText":"Bellroy Sling internal organization",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://bellroy-product-images.imgix.net/bellroy_dot_com_gallery_image/USD/BLLA-ARG-233/3?auto=format&fit=crop&crop=left&w=1500&h=1500",
             "altText":"Bellroy Sling expandable gusset",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Color":"Ranger Green",
                "colorHex":"#6d7853"
             },
             "price":99.00,
             "costPrice":60.00,
             "initialStockQuantity":80,
             "lowStockThreshold":10
          },
          {
             "attributes":{
                "Color":"Slate",
                "colorHex":"#576574"
             },
             "price":99.00,
             "costPrice":60.00,
             "initialStockQuantity":70,
             "lowStockThreshold":10
          },
          {
             "attributes":{
                "Color":"Bronze",
                "colorHex":"#a97142"
             },
             "price":99.00,
             "costPrice":60.00,
             "initialStockQuantity":60,
             "lowStockThreshold":8
          }
       ]
    },
    {
       "sku":"SEIKO-5-SPORTS-SRPD55",
       "name":"Seiko 5 Sports SRPD55 Watch",
       "description":"A robust and reliable automatic watch with a black dial and stainless steel bracelet.",
       "isActive":true,
       "categorySlugs":[
          "bijoux"
       ],
       "images":[
          {
             "imageUrl":"https://media.zeitlounge.com/item/images/154039/full/f1a0b3e1-5d6e-4613-b43e-9b39cc888818.JPG",
             "altText":"Seiko 5 Sports watch front dial",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://prosteps.cloudimg.io/v7m/resizeinbox/729x1000/fsharp0/https://tilroy.s3.eu-west-1.amazonaws.com/253/product/SRPK87K1.png",
             "altText":"Seiko 5 Sports watch on wrist",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://www.montre.com/pictures/seiko-srpk91k1-seiko-5-sports-16295420.jpg",
             "altText":"Seiko 5 Sports watch clasp detail",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://www.gonulsaat.com/idea/jj/18/myassets/products/556/seiko-5-snxf05k1-automatic-erkek-kol-saati-52574.jpeg?revision=1744292584",
             "altText":"Seiko 5 Sports watch exhibition caseback",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Movement":"Automatic",
                "Dial Color":"Black",
                "colorHex":"#000000"
             },
             "price":295.00,
             "costPrice":180.00,
             "initialStockQuantity":40,
             "lowStockThreshold":8
          },
          {
             "attributes":{
                "Movement":"Automatic",
                "Dial Color":"Blue",
                "colorHex":"#000080"
             },
             "price":295.00,
             "costPrice":180.00,
             "initialStockQuantity":35,
             "lowStockThreshold":8
          },
          {
             "attributes":{
                "Movement":"Automatic",
                "Dial Color":"Green",
                "colorHex":"#006400"
             },
             "price":295.00,
             "costPrice":180.00,
             "initialStockQuantity":30,
             "lowStockThreshold":6
          }
       ]
    },
    {
       "sku":"CASIO-GSHOCK-DW5600",
       "name":"Casio G-Shock DW-5600E-1V",
       "description":"The classic, ultra-tough digital watch with shock resistance and 200m water resistance.",
       "isActive":true,
       "categorySlugs":[
          "bijoux"
       ],
       "images":[
          {
             "imageUrl":"https://www.casio.com/content/dam/casio/product-info/locales/africa/fr/timepiece/product/watch/D/DW/DW5/DW-5600E-1V/assets/DW-5600E-1V_01.png.transform/main-visual-pc/image.png",
             "altText":"Casio G-Shock DW-5600 front view",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://www.casio.com/content/dam/casio/product-info/locales/africa/fr/timepiece/product/watch/D/DW/DW5/DW-5600E-1V/assets/DW-5600E-1V_02.jpg",
             "altText":"Casio G-Shock DW-5600 on wrist",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://www.casio.com/content/dam/casio/product-info/locales/africa/fr/timepiece/product/watch/D/DW/DW5/DW-5600HR-1/assets/DW-5600HR-1_Seq3.jpg.transform/main-visual-pc/image.jpg",
             "altText":"Casio G-Shock DW-5600 backlight",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://www.casio.com/content/dam/casio/product-info/locales/africa/fr/timepiece/product/watch/D/DW/DW5/DW-5600HR-1/assets/DW-5600HR-1_Seq4.jpg.transform/main-visual-pc/image.jpg",
             "altText":"Casio G-Shock DW-5600 side view",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Style":"Digital",
                "Color":"Black",
                "colorHex":"#000000"
             },
             "price":69.95,
             "costPrice":35.00,
             "initialStockQuantity":150,
             "lowStockThreshold":20
          }
       ]
    },
    {
       "sku":"LEATHERMAN-WAVE-PLUS",
       "name":"Leatherman Wave Plus Multi-Tool",
       "description":"The internationally best-selling multi-tool, with 18 tools including pliers and replaceable wire cutters.",
       "isActive":true,
       "categorySlugs":[
          "materiel-camping"
       ],
       "images":[
          {
             "imageUrl":"https://ca.leatherman.com/cdn/shop/files/akeneo_3_e_8_a_3e8a70d756780f19c4096300b48adbb660538c02_wave_plus_black_fanned_shopify.jpg?v=1749180549&width=900",
             "altText":"Leatherman Wave Plus closed",
             "isPrimary":true,
             "order":1
          },
          {
             "imageUrl":"https://ca.leatherman.com/cdn/shop/files/akeneo_e_6_9_1_e6914e5275aeb08bf653b1c6c2a29bc45db227e5_wave_plus_black_closed_front_shopify.jpg?v=1736634480&width=900",
             "altText":"Leatherman Wave Plus with pliers open",
             "isPrimary":false,
             "order":2
          },
          {
             "imageUrl":"https://ca.leatherman.com/cdn/shop/files/akeneo_0_0_0_5_000572e9802f18e42ad5dcc6dd09a447c869b4cc_wave_plus_black_beauty_shopify.jpg?v=1736634482&width=900",
             "altText":"Leatherman Wave Plus showing outside-accessible tools",
             "isPrimary":false,
             "order":3
          },
          {
             "imageUrl":"https://ca.leatherman.com/cdn/shop/files/akeneo_1_0_c_c_10cc9cb4679ba0cdb386c5a210ab85e66772e511_wave_plus_lifestyle_1_shopify.jpg?v=1736634485&width=900",
             "altText":"Leatherman Wave Plus in its sheath",
             "isPrimary":false,
             "order":4
          }
       ],
       "variants":[
          {
             "attributes":{
                "Material":"Stainless Steel",
                "Color":"Stainless Steel",
                "colorHex":"#c0c0c0"
             },
             "price":109.95,
             "costPrice":70.00,
             "initialStockQuantity":75,
             "lowStockThreshold":10
          },
          {
             "attributes":{
                "Material":"Black Oxide",
                "Color":"Black Oxide",
                "colorHex":"#303030"
             },
             "price":119.95,
             "costPrice":75.00,
             "initialStockQuantity":60,
             "lowStockThreshold":8
          }
       ]
    }
 ]

const categories = [
    { "name": "Électronique", "slug": "electronique" },
    { "name": "Mode", "slug": "mode" },
    { "name": "Maison & Cuisine", "slug": "maison-cuisine" },
    { "name": "Santé & Beauté", "slug": "sante-beaute" },
    { "name": "Sport & Plein air", "slug": "sport-plein-air" },
    { "name": "Jouets & Jeux", "slug": "jouets-jeux" },
    { "name": "Livres & Papeterie", "slug": "livres-papeterie" },
    { "name": "Chaussures", "slug": "chaussures" },
    { "name": "Accessoires", "slug": "accessoires" },
    { "name": "Fournitures de bureau", "slug": "fournitures-bureau" },
    { "name": "Smartphones", "slug": "smartphones", "parentSlug": "electronique" },
    { "name": "Ordinateurs Portables", "slug": "ordinateurs-portables", "parentSlug": "electronique" },
    { "name": "Accessoires Électroniques", "slug": "accessoires-electroniques", "parentSlug": "electronique" },
    { "name": "Vêtements homme", "slug": "vetements-homme", "parentSlug": "mode" },
    { "name": "Vêtements enfant", "slug": "vetements-enfant", "parentSlug": "mode" },
    { "name": "Meubles", "slug": "meubles", "parentSlug": "maison-cuisine" },
    { "name": "Ustensiles de Cuisine", "slug": "ustensiles-cuisine", "parentSlug": "maison-cuisine" },
    { "name": "Soins de la peau", "slug": "soins-peau", "parentSlug": "sante-beaute" },
    { "name": "Maquillage", "slug": "maquillage", "parentSlug": "sante-beaute" },
    { "name": "Vêtements de sport", "slug": "vetements-sport", "parentSlug": "sport-plein-air" },
    { "name": "Matériel de camping", "slug": "materiel-camping", "parentSlug": "sport-plein-air" },
    { "name": "Jeux de société", "slug": "jeux-societe", "parentSlug": "jouets-jeux" },
    { "name": "Jouets éducatifs", "slug": "jouets-educatifs", "parentSlug": "jouets-jeux" },
    { "name": "Fournitures scolaires", "slug": "fournitures-scolaires", "parentSlug": "livres-papeterie" },
    { "name": "Matériel d’art", "slug": "materiel-art", "parentSlug": "livres-papeterie" },
    { "name": "Sacs", "slug": "sacs", "parentSlug": "accessoires" },
    { "name": "Bijoux", "slug": "bijoux", "parentSlug": "accessoires" },
    { "name": "Bureaux & chaises", "slug": "bureaux-chaises", "parentSlug": "fournitures-bureau" },
    { "name": "Moniteurs", "slug": "moniteurs", "parentSlug": "fournitures-bureau" }
]

module.exports = {
    products,
    categories,
};