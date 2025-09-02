const products = [
   {
      "sku":"SM-S928B-256",
      "name":{
         "en":"Galaxy S24 Ultra 256GB",
         "fr":"Galaxy S24 Ultra 256 Go",
         "ar":"جالكسي S24 ألترا 256 جيجابايت"
      },
      "description":{
         "en":"Premium smartphone with advanced AI camera features and a built-in S Pen.",
         "fr":"Smartphone haut de gamme avec des fonctionnalités de caméra IA avancées et un S Pen intégré.",
         "ar":"هاتف ذكي فاخر مزود بميزات كاميرا الذكاء الاصطناعي المتقدمة وقلم S Pen مدمج."
      },
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
            "initialStockQuantity":125458525,
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
            "initialStockQuantity":125458520,
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
            "initialStockQuantity":125458515,
            "lowStockThreshold":3
         }
      ]
   },
   {
      "sku":"GO-PX8-PRO-128",
      "name":{
         "en":"Google Pixel 8 Pro 128GB",
         "fr":"Google Pixel 8 Pro 128 Go",
         "ar":"جوجل بكسل 8 برو 128 جيجابايت"
      },
      "description":{
         "en":"The Google-engineered phone with a powerful camera system and clean Android experience.",
         "fr":"Le téléphone conçu par Google avec un système de caméra puissant et une expérience Android épurée.",
         "ar":"الهاتف المصمم من جوجل بنظام كاميرا قوي وتجربة أندرويد نظيفة."
      },
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
            "initialStockQuantity":125458530,
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
            "initialStockQuantity":125458525,
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
            "initialStockQuantity":125458522,
            "lowStockThreshold":8
         }
      ]
   },
   {
      "sku":"OP-12-GL-256",
      "name":{
         "en":"OnePlus 12 256GB",
         "fr":"OnePlus 12 256 Go",
         "ar":"ون بلس 12 256 جيجابايت"
      },
      "description":{
         "en":"Flagship performance with ultra-fast charging and a smooth, responsive display.",
         "fr":"Performance de pointe avec une charge ultra-rapide et un écran fluide et réactif.",
         "ar":"أداء رائد مع شحن فائق السرعة وشاشة سلسة وسريعة الاستجابة."
      },
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
            "initialStockQuantity":125458520,
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
            "initialStockQuantity":125458530,
            "lowStockThreshold":5
         }
      ]
   },
   {
      "sku":"DELL-XPS-15-9530",
      "name":{
         "en":"Dell XPS 15 Laptop",
         "fr":"Ordinateur portable Dell XPS 15",
         "ar":"لابتوب ديل XPS 15"
      },
      "description":{
         "en":"A high-performance 15-inch laptop with a stunning InfinityEdge display, ideal for creative professionals.",
         "fr":"Un ordinateur portable 15 pouces haute performance avec un superbe écran InfinityEdge, idéal pour les professionnels de la création.",
         "ar":"كمبيوتر محمول عالي الأداء مقاس 15 بوصة مزود بشاشة InfinityEdge مذهلة، مثالي للمحترفين المبدعين."
      },
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
            "initialStockQuantity":125458515,
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
            "initialStockQuantity":125458510,
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
            "initialStockQuantity":12545855,
            "lowStockThreshold":1
         }
      ]
   },
   {
      "sku":"LEN-TP-X1C-G11",
      "name":{
         "en":"Lenovo ThinkPad X1 Carbon Gen 11",
         "fr":"Lenovo ThinkPad X1 Carbon Gen 11",
         "ar":"لينوفو ثينك باد X1 كاربون الجيل 11"
      },
      "description":{
         "en":"Ultra-light and durable business laptop with a renowned keyboard and robust security features.",
         "fr":"Ordinateur portable professionnel ultra-léger et durable avec un clavier réputé et des fonctionnalités de sécurité robustes.",
         "ar":"كمبيوتر محمول للأعمال خفيف للغاية ومتين مع لوحة مفاتيح شهيرة وميزات أمان قوية."
      },
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
            "initialStockQuantity":125458512,
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
            "initialStockQuantity":125458518,
            "lowStockThreshold":4
         }
      ]
   },
   {
      "sku":"HP-SP-X360-14",
      "name":{
         "en":"HP Spectre x360 14",
         "fr":"HP Spectre x360 14",
         "ar":"إتش بي سبكتر x360 14"
      },
      "description":{
         "en":"A versatile 2-in-1 convertible laptop with a premium design and OLED touch display.",
         "fr":"Un ordinateur portable convertible 2-en-1 polyvalent avec un design haut de gamme et un écran tactile OLED.",
         "ar":"كمبيوتر محمول 2 في 1 متعدد الاستخدامات بتصميم فاخر وشاشة لمس OLED."
      },
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
            "initialStockQuantity":125458518,
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
            "initialStockQuantity":125458515,
            "lowStockThreshold":4
         }
      ]
   },
   {
      "sku":"LOGI-MX-MASTER-3S",
      "name":{
         "en":"Logitech MX Master 3S Mouse",
         "fr":"Souris Logitech MX Master 3S",
         "ar":"ماوس لوجيتك MX Master 3S"
      },
      "description":{
         "en":"Advanced wireless performance mouse with an ergonomic design and quiet clicks.",
         "fr":"Souris sans fil de performance avancée avec un design ergonomique et des clics silencieux.",
         "ar":"ماوس لاسلكي متقدم الأداء بتصميم مريح ونقرات هادئة."
      },
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
            "initialStockQuantity":1254585150,
            "lowStockThreshold":20
         },
         {
            "attributes":{
               "Color":"Pale Gray",
               "colorHex":"#e0e0e0"
            },
            "price":99.99,
            "costPrice":65.00,
            "initialStockQuantity":125458590,
            "lowStockThreshold":15
         }
      ]
   },
   {
      "sku":"ANKR-737-PWRBNK",
      "name":{
         "en":"Anker 737 Power Bank (PowerCore 24K)",
         "fr":"Batterie Externe Anker 737 (PowerCore 24K)",
         "ar":"بنك الطاقة أنكر 737 (باوركور 24K)"
      },
      "description":{
         "en":"High-capacity 24,000mAh power bank with 140W fast charging output.",
         "fr":"Batterie externe haute capacité de 24 000 mAh avec une sortie de charge rapide de 140W.",
         "ar":"بنك طاقة عالي السعة 24,000 مللي أمبير في الساعة مع مخرج شحن سريع بقوة 140 واط."
      },
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
            "initialStockQuantity":125458580,
            "lowStockThreshold":10
         }
      ]
   },
   {
      "sku":"SONY-WH1000XM5-BLK",
      "name":{
         "en":"Sony WH-1000XM5 Wireless Headphones",
         "fr":"Casque sans fil Sony WH-1000XM5",
         "ar":"سماعات سوني اللاسلكية WH-1000XM5"
      },
      "description":{
         "en":"Industry-leading noise canceling headphones with exceptional sound quality.",
         "fr":"Casque à réduction de bruit de pointe avec une qualité sonore exceptionnelle.",
         "ar":"سماعات رأس رائدة في مجال إلغاء الضوضاء بجودة صوت استثنائية."
      },
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
            "initialStockQuantity":125458540,
            "lowStockThreshold":5
         },
         {
            "attributes":{
               "Color":"Silver",
               "colorHex":"#d3d3d3"
            },
            "price":399.99,
            "costPrice":280.00,
            "initialStockQuantity":125458535,
            "lowStockThreshold":5
         },
         {
            "attributes":{
               "Color":"Midnight Blue",
               "colorHex":"#003366"
            },
            "price":399.99,
            "costPrice":280.00,
            "initialStockQuantity":125458530,
            "lowStockThreshold":5
         }
      ]
   },
   {
      "sku":"LOGI-MX-KEYS-S",
      "name":{
         "en":"Logitech MX Keys S Keyboard",
         "fr":"Clavier Logitech MX Keys S",
         "ar":"لوحة مفاتيح لوجيتك MX Keys S"
      },
      "description":{
         "en":"Advanced wireless illuminated keyboard with smart actions and comfortable typing.",
         "fr":"Clavier sans fil illuminé avancé avec des actions intelligentes et une frappe confortable.",
         "ar":"لوحة مفاتيح لاسلكية مضيئة متقدمة مع إجراءات ذكية وكتابة مريحة."
      },
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
            "initialStockQuantity":125458575,
            "lowStockThreshold":15
         },
         {
            "attributes":{
               "Color":"Pale Gray",
               "colorHex":"#e0e0e0"
            },
            "price":109.99,
            "costPrice":75.00,
            "initialStockQuantity":125458550,
            "lowStockThreshold":10
         }
      ]
   },
   {
      "sku":"NK-AIR-FORCE-1-WHT",
      "name":{
         "en":"Nike Air Force 1 '07",
         "fr":"Nike Air Force 1 '07",
         "ar":"نايك اير فورس 1 '07"
      },
      "description":{
         "en":"The classic, iconic basketball shoe that has become a streetwear staple. Crisp leather and timeless design.",
         "fr":"La chaussure de basketball classique et emblématique devenue un incontournable du streetwear. Cuir impeccable et design intemporel.",
         "ar":"حذاء كرة السلة الكلاسيكي الأيقوني الذي أصبح أساسيًا في أزياء الشارع. جلد نقي وتصميم لا يتأثر بمرور الزمن."
      },
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
            "initialStockQuantity":125458550,
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
            "initialStockQuantity":125458545,
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
            "initialStockQuantity":125458560,
            "lowStockThreshold":10
         }
      ]
   },
   {
      "sku":"AD-ULTRABOOST-1-BLK",
      "name":{
         "en":"Adidas Ultraboost 1.0",
         "fr":"Adidas Ultraboost 1.0",
         "ar":"أديداس ألترابوست 1.0"
      },
      "description":{
         "en":"Performance running shoes with responsive Boost cushioning for incredible energy return.",
         "fr":"Chaussures de course performantes avec un amorti Boost réactif pour un retour d'énergie incroyable.",
         "ar":"أحذية جري عالية الأداء مع توسيد Boost سريع الاستجابة لعودة طاقة لا تصدق."
      },
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
            "initialStockQuantity":125458535,
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
            "initialStockQuantity":125458530,
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
            "initialStockQuantity":125458540,
            "lowStockThreshold":7
         }
      ]
   },
   {
      "sku":"NB-990V6-GRY",
      "name":{
         "en":"New Balance 990v6",
         "fr":"New Balance 990v6",
         "ar":"نيو بالانس 990v6"
      },
      "description":{
         "en":"Premium lifestyle sneaker known for its exceptional comfort and quality craftsmanship.",
         "fr":"Basket de style de vie haut de gamme connue pour son confort exceptionnel et sa fabrication de qualité.",
         "ar":"حذاء رياضي فاخر لأسلوب الحياة معروف براحته الاستثنائية وحرفيته عالية الجودة."
      },
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
            "initialStockQuantity":125458525,
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
            "initialStockQuantity":125458520,
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
            "initialStockQuantity":125458515,
            "lowStockThreshold":3
         }
      ]
   },
   {
      "sku":"HM-POANG-CHAIR-BRCH",
      "name":{
         "en":"Poäng Armchair",
         "fr":"Fauteuil Poäng",
         "ar":"كرسي بذراعين بونج"
      },
      "description":{
         "en":"A classic and comfortable armchair with a bentwood frame that provides nice resilience.",
         "fr":"Un fauteuil classique et confortable avec une structure en bois courbé qui offre une belle résilience.",
         "ar":"كرسي بذراعين كلاسيكي ومريح بإطار من الخشب المنحني يوفر مرونة لطيفة."
      },
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
            "initialStockQuantity":125458530,
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
            "initialStockQuantity":125458525,
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
            "initialStockQuantity":125458520,
            "lowStockThreshold":4
         }
      ]
   },
   {
      "sku":"HM-BEKANT-DESK-WHT",
      "name":{
         "en":"Bekant Sit/Stand Desk",
         "fr":"Bureau assis/debout Bekant",
         "ar":"مكتب بيكانت للجلوس/الوقوف"
      },
      "description":{
         "en":"An adjustable height desk that allows you to switch between sitting and standing.",
         "fr":"Un bureau réglable en hauteur qui vous permet de passer de la position assise à la position debout.",
         "ar":"مكتب قابل لتعديل الارتفاع يسمح لك بالتبديل بين الجلوس والوقوف."
      },
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
            "initialStockQuantity":125458520,
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
            "initialStockQuantity":125458515,
            "lowStockThreshold":4
         }
      ]
   },
   {
      "sku":"HM-MARKUS-CHAIR-BLK",
      "name":{
         "en":"Markus Office Chair",
         "fr":"Chaise de bureau Markus",
         "ar":"كرسي مكتب ماركوس"
      },
      "description":{
         "en":"Ergonomic office chair with a high back and mesh material for comfortable seating during long workdays.",
         "fr":"Chaise de bureau ergonomique avec un dossier haut et un matériau en maille pour une assise confortable pendant les longues journées de travail.",
         "ar":"كرسي مكتب مريح بظهر عالٍ ومادة شبكية لجلوس مريح خلال أيام العمل الطويلة."
      },
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
            "initialStockQuantity":125458540,
            "lowStockThreshold":8
         },
         {
            "attributes":{
               "Color":"Glose black",
               "colorHex":"#000000"
            },
            "price":249.00,
            "costPrice":155.00,
            "initialStockQuantity":125458530,
            "lowStockThreshold":6
         }
      ]
   },
   {
      "sku":"DELL-U2723QE-MONITOR",
      "name":{
         "en":"Dell UltraSharp 27 4K USB-C Hub Monitor",
         "fr":"Moniteur Dell UltraSharp 27 4K avec hub USB-C",
         "ar":"شاشة ديل UltraSharp 27 4K USB-C Hub"
      },
      "description":{
         "en":"A 27-inch 4K monitor with exceptional color and clarity, featuring IPS Black technology.",
         "fr":"Un moniteur 4K de 27 pouces avec des couleurs et une clarté exceptionnelles, doté de la technologie IPS Black.",
         "ar":"شاشة 4K مقاس 27 بوصة بألوان ووضوح استثنائيين، تتميز بتقنية IPS Black."
      },
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
            "initialStockQuantity":125458525,
            "lowStockThreshold":5
         }
      ]
   },
   {
      "sku":"LG-34WQHD-CURVED",
      "name":{
         "en":"LG 34-Inch UltraWide QHD Monitor",
         "fr":"Moniteur LG 34 pouces UltraWide QHD",
         "ar":"شاشة LG مقاس 34 بوصة UltraWide QHD"
      },
      "description":{
         "en":"Curved ultrawide monitor perfect for multitasking and immersive gaming experiences.",
         "fr":"Moniteur ultra-large incurvé parfait pour le multitâche et les expériences de jeu immersives.",
         "ar":"شاشة منحنية فائقة العرض مثالية لتعدد المهام وتجارب الألعاب الغامرة."
      },
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
            "initialStockQuantity":125458530,
            "lowStockThreshold":6
         }
      ]
   },
   {
      "sku":"BENQ-PD2705U-DESIGNVUE",
      "name":{
         "en":"BenQ PD2705U 27-inch 4K Designer Monitor",
         "fr":"Moniteur pour designers BenQ PD2705U 27 pouces 4K",
         "ar":"شاشة بنكيو للمصممين PD2705U مقاس 27 بوصة 4K"
      },
      "description":{
         "en":"Color-accurate monitor for creative professionals, featuring AQCOLOR technology.",
         "fr":"Moniteur aux couleurs précises pour les professionnels de la création, doté de la technologie AQCOLOR.",
         "ar":"شاشة دقيقة الألوان للمحترفين المبدعين، تتميز بتقنية AQCOLOR."
      },
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
            "initialStockQuantity":125458518,
            "lowStockThreshold":4
         }
      ]
   },
   {
      "sku":"HM-KALLAX-SHELF-WHT",
      "name":{
         "en":"Kallax Shelving Unit",
         "fr":"Étagère Kallax",
         "ar":"وحدة أرفف كالاكس"
      },
      "description":{
         "en":"A simple and stylish shelving unit that can be placed standing or lying.",
         "fr":"Une étagère simple et élégante qui peut être placée debout ou couchée.",
         "ar":"وحدة أرفف بسيطة وأنيقة يمكن وضعها واقفة أو مستلقية."
      },
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
            "initialStockQuantity":125458560,
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
            "initialStockQuantity":125458550,
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
            "initialStockQuantity":125458570,
            "lowStockThreshold":15
         }
      ]
   },
   {
      "sku":"HM-BILLY-BOOKCASE-WHT",
      "name":{
         "en":"Billy Bookcase",
         "fr":"Bibliothèque Billy",
         "ar":"خزانة كتب بيلي"
      },
      "description":{
         "en":"A beloved and versatile bookcase, adaptable to your storage needs.",
         "fr":"Une bibliothèque appréciée et polyvalente, adaptable à vos besoins de rangement.",
         "ar":"خزانة كتب محبوبة ومتعددة الاستخدامات، قابلة للتكيف مع احتياجات التخزين الخاصة بك."
      },
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
            "initialStockQuantity":125458575,
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
            "initialStockQuantity":125458560,
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
            "initialStockQuantity":125458550,
            "lowStockThreshold":10
         }
      ]
   },
   {
      "sku":"LODGE-CASTIRON-12IN",
      "name":{
         "en":"Lodge 12-Inch Cast Iron Skillet",
         "fr":"Poêle en fonte Lodge de 12 pouces",
         "ar":"مقلاة لودج من الحديد الزهر مقاس 12 بوصة"
      },
      "description":{
         "en":"Pre-seasoned cast iron skillet for versatile cooking on any heat source.",
         "fr":"Poêle en fonte pré-assaisonnée pour une cuisson polyvalente sur n'importe quelle source de chaleur.",
         "ar":"مقلاة من الحديد الزهر المتبل مسبقًا للطبخ المتنوع على أي مصدر حرارة."
      },
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
            "initialStockQuantity":1254585200,
            "lowStockThreshold":30
         },
         {
            "attributes":{
               "Size":"10.25-Inch"
            },
            "price":21.99,
            "costPrice":13.00,
            "initialStockQuantity":1254585250,
            "lowStockThreshold":35
         },
         {
            "attributes":{
               "Size":"8-Inch"
            },
            "price":14.99,
            "costPrice":9.00,
            "initialStockQuantity":1254585300,
            "lowStockThreshold":40
         }
      ]
   },
   {
      "sku":"OXO-GOODGRIPS-PEELER",
      "name":{
         "en":"OXO Good Grips Swivel Peeler",
         "fr":"Éplucheur pivotant OXO Good Grips",
         "ar":"مقشرة OXO Good Grips الدوارة"
      },
      "description":{
         "en":"Ergonomic and sharp peeler for effortlessly peeling fruits and vegetables.",
         "fr":"Éplucheur ergonomique et tranchant pour peler sans effort les fruits et légumes.",
         "ar":"مقشرة مريحة وحادة لتقشير الفواكه والخضروات دون عناء."
      },
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
            "initialStockQuantity":1254585500,
            "lowStockThreshold":50
         }
      ]
   },
   {
      "sku":"INSTAPOT-DUO-6QT",
      "name":{
         "en":"Instant Pot Duo 6-Quart",
         "fr":"Instant Pot Duo 6 pintes",
         "ar":"إناء الطهي الفوري ديو 6 كوارت"
      },
      "description":{
         "en":"7-in-1 electric pressure cooker, slow cooker, rice cooker, and more.",
         "fr":"Autocuiseur électrique 7-en-1, mijoteuse, cuiseur à riz, et plus encore.",
         "ar":"طباخ ضغط كهربائي 7 في 1، طباخ بطيء، طباخ أرز، والمزيد."
      },
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
            "initialStockQuantity":125458560,
            "lowStockThreshold":10
         },
         {
            "attributes":{
               "Size":"8-Quart"
            },
            "price":109.99,
            "costPrice":75.00,
            "initialStockQuantity":125458540,
            "lowStockThreshold":8
         },
         {
            "attributes":{
               "Size":"3-Quart"
            },
            "price":79.99,
            "costPrice":55.00,
            "initialStockQuantity":125458550,
            "lowStockThreshold":10
         }
      ]
   },
   {
      "sku":"PYREX-MEASURE-CUP-SET",
      "name":{
         "en":"Pyrex Glass Measuring Cup Set",
         "fr":"Ensemble de tasses à mesurer en verre Pyrex",
         "ar":"طقم أكواب قياس زجاجية من بايركس"
      },
      "description":{
         "en":"Durable 3-piece glass measuring cup set (1-cup, 2-cup, 4-cup).",
         "fr":"Ensemble durable de 3 tasses à mesurer en verre (1 tasse, 2 tasses, 4 tasses).",
         "ar":"طقم أكواب قياس زجاجية متين من 3 قطع (1 كوب، 2 كوب، 4 كوب)."
      },
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
            "initialStockQuantity":1254585120,
            "lowStockThreshold":20
         }
      ]
   },
   {
      "sku":"CERAVE-MOIST-CRM",
      "name":{
         "en":"CeraVe Moisturizing Cream",
         "fr":"Crème hydratante CeraVe",
         "ar":"كريم سيرافي المرطب"
      },
      "description":{
         "en":"A rich, non-greasy moisturizing cream for normal to dry skin with ceramides.",
         "fr":"Une crème hydratante riche et non grasse pour les peaux normales à sèches avec des céramides.",
         "ar":"كريم مرطب غني وغير دهني للبشرة العادية إلى الجافة يحتوي على السيراميد."
      },
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
            "initialStockQuantity":1254585100,
            "lowStockThreshold":15
         },
         {
            "attributes":{
               "Size":"16 oz with Pump"
            },
            "price":18.99,
            "costPrice":11.50,
            "initialStockQuantity":125458580,
            "lowStockThreshold":15
         }
      ]
   },
   {
      "sku":"LAROCHE-HYDRATING-CLEANSER",
      "name":{
         "en":"La Roche-Posay Hydrating Gentle Cleanser",
         "fr":"Nettoyant doux hydratant La Roche-Posay",
         "ar":"منظف لطيف مرطب من لا روش بوزيه"
      },
      "description":{
         "en":"A gentle face wash for normal to dry, sensitive skin. Soap-free and fragrance-free.",
         "fr":"Un nettoyant visage doux pour les peaux sensibles normales à sèches. Sans savon et sans parfum.",
         "ar":"غسول وجه لطيف للبشرة الحساسة العادية إلى الجافة. خالي من الصابون والعطور."
      },
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
            "initialStockQuantity":125458590,
            "lowStockThreshold":15
         },
         {
            "attributes":{
               "Size":"6.76 fl oz"
            },
            "price":12.99,
            "costPrice":7.50,
            "initialStockQuantity":1254585110,
            "lowStockThreshold":20
         }
      ]
   },
   {
      "sku":"SUPERGOOP-UNSEEN-SPF40",
      "name":{
         "en":"Supergoop! Unseen Sunscreen SPF 40",
         "fr":"Écran solaire invisible Supergoop! SPF 40",
         "ar":"واقي شمسي غير مرئي من سوبرجوب! بعامل حماية 40"
      },
      "description":{
         "en":"An invisible, weightless, and scentless daily sunscreen that works as a primer.",
         "fr":"Un écran solaire quotidien invisible, léger et sans parfum qui sert de base de maquillage.",
         "ar":"واقي شمسي يومي غير مرئي وخفيف الوزن وعديم الرائحة يعمل كبرايمر."
      },
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
            "initialStockQuantity":125458570,
            "lowStockThreshold":10
         },
         {
            "attributes":{
               "Size":"2.5 oz (Jumbo)"
            },
            "price":48.00,
            "costPrice":30.00,
            "initialStockQuantity":125458540,
            "lowStockThreshold":8
         }
      ]
   },
   {
      "sku":"LEVIS-501-JEAN-M",
      "name":{
         "en":"Levi's 501 Original Fit Men's Jeans",
         "fr":"Jeans Levi's 501 Original Fit pour homme",
         "ar":"جينز ليفايز 501 الأصلي للرجال"
      },
      "description":{
         "en":"The timeless, original blue jean with a classic straight leg and button fly.",
         "fr":"Le jean bleu original et intemporel avec une jambe droite classique et une braguette à boutons.",
         "ar":"الجينز الأزرق الأصلي الخالد بساق مستقيمة كلاسيكية وسحاب بأزرار."
      },
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
            "initialStockQuantity":125458580,
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
            "initialStockQuantity":125458575,
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
            "initialStockQuantity":125458560,
            "lowStockThreshold":8
         }
      ]
   },
   {
      "sku":"CARHARTT-K87-TSHIRT-M",
      "name":{
         "en":"Carhartt K87 Workwear T-Shirt",
         "fr":"T-shirt de travail Carhartt K87",
         "ar":"تي شيرت عمل كارهارت K87"
      },
      "description":{
         "en":"A durable, heavyweight cotton t-shirt with a chest pocket and a roomy fit.",
         "fr":"Un t-shirt en coton épais et durable avec une poche poitrine et une coupe ample.",
         "ar":"تي شيرت قطني متين وثقيل الوزن بجيب على الصدر وقصة واسعة."
      },
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
            "initialStockQuantity":1254585250,
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
            "initialStockQuantity":1254585300,
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
            "initialStockQuantity":1254585200,
            "lowStockThreshold":25
         }
      ]
   },
   {
      "sku":"CHAMPION-HOODIE-M",
      "name":{
         "en":"Champion Reverse Weave Hoodie",
         "fr":"Sweat à capuche Champion Reverse Weave",
         "ar":"هودي شامبيون ريفيرس ويف"
      },
      "description":{
         "en":"A classic, heavyweight fleece hoodie that resists vertical shrinkage.",
         "fr":"Un sweat à capuche classique en molleton épais qui résiste au rétrécissement vertical.",
         "ar":"هودي كلاسيكي من الصوف الثقيل يقاوم الانكماش العمودي."
      },
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
            "initialStockQuantity":125458590,
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
            "initialStockQuantity":1254585100,
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
            "initialStockQuantity":125458580,
            "lowStockThreshold":10
         }
      ]
   },
   {
      "sku":"LEGO-STARWARS-XWING-75355",
      "name":{
         "en":"LEGO Star Wars X-Wing Starfighter",
         "fr":"Chasseur X-Wing de LEGO Star Wars",
         "ar":"ليغو ستار وورز إكس-وينج ستارفايتر"
      },
      "description":{
         "en":"Highly detailed Ultimate Collector Series version of the iconic X-Wing Starfighter.",
         "fr":"Version Ultimate Collector Series très détaillée de l'emblématique Chasseur X-Wing.",
         "ar":"نسخة مفصلة للغاية من سلسلة Ultimate Collector من مقاتلة X-Wing الشهيرة."
      },
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
            "initialStockQuantity":125458520,
            "lowStockThreshold":4
         }
      ]
   },
   {
      "sku":"RAVENS-PUZZLE-1000PC",
      "name":{
         "en":"Ravensburger 1000 Piece Jigsaw Puzzle",
         "fr":"Puzzle Ravensburger de 1000 pièces",
         "ar":"أحجية الصور المقطوعة من رافنسبورجر 1000 قطعة"
      },
      "description":{
         "en":"A high-quality 1000-piece puzzle with Softclick technology for a perfect fit.",
         "fr":"Un puzzle de 1000 pièces de haute qualité avec la technologie Softclick pour un ajustement parfait.",
         "ar":"أحجية عالية الجودة مكونة من 1000 قطعة بتقنية Softclick لتناسب مثالي."
      },
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
            "initialStockQuantity":125458580,
            "lowStockThreshold":10
         },
         {
            "attributes":{
               "Theme":"Starry Night"
            },
            "price":21.99,
            "costPrice":12.00,
            "initialStockQuantity":125458575,
            "lowStockThreshold":10
         },
         {
            "attributes":{
               "Theme":"World Map"
            },
            "price":21.99,
            "costPrice":12.00,
            "initialStockQuantity":125458560,
            "lowStockThreshold":8
         }
      ]
   },
   {
      "sku":"CATAN-BOARD-GAME",
      "name":{
         "en":"Catan Board Game",
         "fr":"Jeu de société Catan",
         "ar":"لعبة لوح كاتان"
      },
      "description":{
         "en":"The classic strategy board game of trade, building, and settlement.",
         "fr":"Le jeu de société de stratégie classique de commerce, de construction et de colonisation.",
         "ar":"لعبة اللوح الاستراتيجية الكلاسيكية للتجارة والبناء والاستيطان."
      },
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
            "initialStockQuantity":1254585100,
            "lowStockThreshold":15
         }
      ]
   },
   {
      "sku":"TICKET-TO-RIDE-GAME",
      "name":{
         "en":"Ticket to Ride Board Game",
         "fr":"Jeu de société Les Aventuriers du Rail",
         "ar":"لعبة لوح تذكرة الركوب"
      },
      "description":{
         "en":"A cross-country train adventure where players collect and play matching train cards to claim railway routes.",
         "fr":"Une aventure ferroviaire à travers le pays où les joueurs collectent et jouent des cartes de train assorties pour revendiquer des itinéraires ferroviaires.",
         "ar":"مغامرة قطار عبر البلاد حيث يجمع اللاعبون ويلعبون بطاقات قطار متطابقة للمطالبة بمسارات السكك الحديدية."
      },
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
            "initialStockQuantity":125458570,
            "lowStockThreshold":10
         }
      ]
   },
   {
      "sku":"OSPREY-ATMOS-AG-65",
      "name":{
         "en":"Osprey Atmos AG 65 Backpack",
         "fr":"Sac à dos Osprey Atmos AG 65",
         "ar":"حقيبة ظهر Osprey Atmos AG 65"
      },
      "description":{
         "en":"A revolutionary backpacking pack with Anti-Gravity suspension for outstanding comfort and ventilation.",
         "fr":"Un sac à dos de randonnée révolutionnaire avec une suspension Anti-Gravity pour un confort et une ventilation exceptionnels.",
         "ar":"حقيبة ظهر ثورية مع نظام تعليق مضاد للجاذبية لراحة وتهوية فائقة."
      },
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
            "initialStockQuantity":125458525,
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
            "initialStockQuantity":125458530,
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
            "initialStockQuantity":125458520,
            "lowStockThreshold":4
         }
      ]
   },
   {
      "sku":"MSR-POCKETROCKET-2",
      "name":{
         "en":"MSR PocketRocket 2 Stove",
         "fr":"Réchaud MSR PocketRocket 2",
         "ar":"موقد MSR PocketRocket 2"
      },
      "description":{
         "en":"An ultralight, compact, and fast-boiling canister stove for minimalist backpackers.",
         "fr":"Un réchaud à cartouche ultraléger, compact et à ébullition rapide pour les randonneurs minimalistes.",
         "ar":"موقد علب خفيف الوزن وصغير الحجم وسريع الغليان للمتنزهين الباحثين عن البساطة."
      },
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
            "initialStockQuantity":1254585120,
            "lowStockThreshold":20
         }
      ]
   },
   {
      "sku":"THERMAREST-Z-LITE-SOL",
      "name":{
         "en":"Therm-a-Rest Z Lite Sol Sleeping Pad",
         "fr":"Matelas de sol Therm-a-Rest Z Lite Sol",
         "ar":"وسادة نوم Therm-a-Rest Z Lite Sol"
      },
      "description":{
         "en":"A compact and durable closed-cell foam sleeping pad with a reflective coating to boost warmth.",
         "fr":"Un matelas de sol compact et durable en mousse à cellules fermées avec un revêtement réfléchissant pour augmenter la chaleur.",
         "ar":"وسادة نوم مدمجة ومتينة من الإسفنج ذي الخلايا المغلقة مع طلاء عاكس لزيادة الدفء."
      },
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
            "initialStockQuantity":125458590,
            "lowStockThreshold":15
         },
         {
            "attributes":{
               "Size":"Short"
            },
            "price":44.95,
            "costPrice":26.00,
            "initialStockQuantity":125458550,
            "lowStockThreshold":10
         }
      ]
   },
   {
      "sku":"MOLESKINE-CLASSIC-L",
      "name":{
         "en":"Moleskine Classic Notebook, Large, Ruled",
         "fr":"Carnet classique Moleskine, Grand, Ligné",
         "ar":"دفتر مولسكين الكلاسيكي، كبير، مسطر"
      },
      "description":{
         "en":"The legendary notebook used by artists and thinkers. Hard cover, ruled pages.",
         "fr":"Le carnet légendaire utilisé par les artistes et les penseurs. Couverture rigide, pages lignées.",
         "ar":"الدفتر الأسطوري الذي يستخدمه الفنانون والمفكرون. غلاف صلب، صفحات مسطرة."
      },
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
            "initialStockQuantity":1254585300,
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
            "initialStockQuantity":1254585150,
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
            "initialStockQuantity":1254585100,
            "lowStockThreshold":15
         }
      ]
   },
   {
      "sku":"PILOT-G2-PEN-BLK-12",
      "name":{
         "en":"Pilot G2 Premium Gel Roller Pens, Black (12-Pack)",
         "fr":"Stylos à encre gel Pilot G2 Premium, Noir (Paquet de 12)",
         "ar":"أقلام جل بايلوت G2 الفاخرة، أسود (عبوة 12)"
      },
      "description":{
         "en":"The top-selling retractable gel pen in America. Smooth writing and comfortable grip.",
         "fr":"Le stylo gel rétractable le plus vendu en Amérique. Écriture fluide et prise en main confortable.",
         "ar":"القلم الجل القابل للسحب الأكثر مبيعًا في أمريكا. كتابة سلسة وقبضة مريحة."
      },
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
            "initialStockQuantity":1254585500,
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
            "initialStockQuantity":1254585300,
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
            "initialStockQuantity":1254585400,
            "lowStockThreshold":50
         }
      ]
   },
   {
      "sku":"STAEDTLER-PENCIL-SET",
      "name":{
         "en":"Staedtler Mars Lumograph Drawing Pencils (Set of 12)",
         "fr":"Crayons à dessin Staedtler Mars Lumograph (Ensemble de 12)",
         "ar":"أقلام رسم ستادلر مارس لوموجراف (مجموعة من 12)"
      },
      "description":{
         "en":"High-quality drawing pencils in a range of hardness grades for artists and designers.",
         "fr":"Crayons à dessin de haute qualité dans une gamme de duretés pour artistes et designers.",
         "ar":"أقلام رسم عالية الجودة بمجموعة من درجات الصلابة للفنانين والمصممين."
      },
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
            "initialStockQuantity":1254585150,
            "lowStockThreshold":20
         }
      ]
   },
   {
      "sku":"CANSON-XL-SKETCHBOOK",
      "name":{
         "en":"Canson XL Series Sketch Pad",
         "fr":"Bloc de dessin Canson XL Series",
         "ar":"كراسة رسم كانسون سلسلة XL"
      },
      "description":{
         "en":"A wire-bound sketch pad with smooth, acid-free paper, perfect for sketching and drawing.",
         "fr":"Un bloc de dessin à spirale avec du papier lisse et sans acide, parfait pour le croquis et le dessin.",
         "ar":"كراسة رسم بسلك حلزوني مع ورق ناعم وخالي من الأحماض، مثالية للرسم والتخطيط."
      },
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
            "initialStockQuantity":1254585200,
            "lowStockThreshold":30
         },
         {
            "attributes":{
               "Size":"5.5x8.5 inches",
               "Sheets":"100"
            },
            "price":8.99,
            "costPrice":5.00,
            "initialStockQuantity":1254585250,
            "lowStockThreshold":35
         }
      ]
   },
   {
      "sku":"TI-84-PLUS-CE-CALC",
      "name":{
         "en":"Texas Instruments TI-84 Plus CE Graphing Calculator",
         "fr":"Calculatrice graphique Texas Instruments TI-84 Plus CE",
         "ar":"آلة حاسبة بيانية Texas Instruments TI-84 Plus CE"
      },
      "description":{
         "en":"A powerful graphing calculator with a full-color display, ideal for high school and college math.",
         "fr":"Une calculatrice graphique puissante avec un écran couleur, idéale pour les mathématiques au lycée et à l'université.",
         "ar":"آلة حاسبة بيانية قوية بشاشة ملونة كاملة، مثالية للرياضيات في المدارس الثانوية والجامعات."
      },
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
            "initialStockQuantity":125458550,
            "lowStockThreshold":10
         },
         {
            "attributes":{
               "Color":"Radical Red",
               "colorHex":"#ff355e"
            },
            "price":129.99,
            "costPrice":95.00,
            "initialStockQuantity":125458530,
            "lowStockThreshold":5
         },
         {
            "attributes":{
               "Color":"Rose Gold",
               "colorHex":"#b76e79"
            },
            "price":134.99,
            "costPrice":98.00,
            "initialStockQuantity":125458525,
            "lowStockThreshold":5
         }
      ]
   },
   {
      "sku":"POST-IT-NOTES-3X3-YLW",
      "name":{
         "en":"Post-it Notes, 3x3, Canary Yellow",
         "fr":"Notes Post-it, 3x3, Jaune Canari",
         "ar":"أوراق ملاحظات بوست-إت، 3x3، أصفر كناري"
      },
      "description":{
         "en":"The classic sticky notes for reminders and short messages. 12 pads per pack.",
         "fr":"Les notes autocollantes classiques pour les rappels et les messages courts. 12 blocs par paquet.",
         "ar":"الأوراق اللاصقة الكلاسيكية للتذكيرات والرسائل القصيرة. 12 دفترًا في العبوة."
      },
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
            "initialStockQuantity":1254585400,
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
            "initialStockQuantity":1254585300,
            "lowStockThreshold":40
         }
      ]
   },
   {
      "sku":"FJALLRAVEN-KANKEN-BP",
      "name":{
         "en":"Fjällräven Kånken Classic Backpack",
         "fr":"Sac à dos classique Fjällräven Kånken",
         "ar":"حقيبة ظهر Fjällräven Kånken الكلاسيكية"
      },
      "description":{
         "en":"An iconic and durable backpack made from Vinylon F fabric with a removable seat pad.",
         "fr":"Un sac à dos emblématique et durable fabriqué en tissu Vinylon F avec un coussin d'assise amovible.",
         "ar":"حقيبة ظهر أيقونية ومتينة مصنوعة من قماش Vinylon F مع وسادة مقعد قابلة للإزالة."
      },
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
            "initialStockQuantity":1254585100,
            "lowStockThreshold":15
         },
         {
            "attributes":{
               "Color":"Ox Red",
               "colorHex":"#7a0019"
            },
            "price":80.00,
            "costPrice":45.00,
            "initialStockQuantity":125458580,
            "lowStockThreshold":12
         },
         {
            "attributes":{
               "Color":"Frost Green",
               "colorHex":"#8aa37b"
            },
            "price":80.00,
            "costPrice":45.00,
            "initialStockQuantity":125458590,
            "lowStockThreshold":15
         }
      ]
   },
   {
      "sku":"HERSCHEL-NOVEL-DUFFEL",
      "name":{
         "en":"Herschel Novel Duffle Bag",
         "fr":"Sac de sport Herschel Novel",
         "ar":"حقيبة دافل Herschel Novel"
      },
      "description":{
         "en":"A classic duffle bag with a signature separate shoe compartment.",
         "fr":"Un sac de sport classique avec un compartiment à chaussures séparé signature.",
         "ar":"حقيبة دافل كلاسيكية مع جيب أحذية منفصل مميز."
      },
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
            "initialStockQuantity":125458560,
            "lowStockThreshold":10
         },
         {
            "attributes":{
               "Color":"Raven Crosshatch",
               "colorHex":"#696969"
            },
            "price":99.99,
            "costPrice":55.00,
            "initialStockQuantity":125458545,
            "lowStockThreshold":8
         },
         {
            "attributes":{
               "Color":"Navy/Tan",
               "colorHex":"#000080"
            },
            "price":99.99,
            "costPrice":55.00,
            "initialStockQuantity":125458550,
            "lowStockThreshold":10
         }
      ]
   },
   {
      "sku":"BELLROY-SLING-7L",
      "name":{
         "en":"Bellroy Sling 7L",
         "fr":"Sacoche Bellroy Sling 7L",
         "ar":"حقيبة بيلروي سلينج 7 لتر"
      },
      "description":{
         "en":"A versatile and smartly designed sling bag for everyday essentials.",
         "fr":"Une sacoche polyvalente et intelligemment conçue pour les essentiels du quotidien.",
         "ar":"حقيبة كتف متعددة الاستخدامات ومصممة بذكاء للأساسيات اليومية."
      },
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
            "initialStockQuantity":125458580,
            "lowStockThreshold":10
         },
         {
            "attributes":{
               "Color":"Slate",
               "colorHex":"#576574"
            },
            "price":99.00,
            "costPrice":60.00,
            "initialStockQuantity":125458570,
            "lowStockThreshold":10
         },
         {
            "attributes":{
               "Color":"Bronze",
               "colorHex":"#a97142"
            },
            "price":99.00,
            "costPrice":60.00,
            "initialStockQuantity":125458560,
            "lowStockThreshold":8
         }
      ]
   },
   {
      "sku":"SEIKO-5-SPORTS-SRPD55",
      "name":{
         "en":"Seiko 5 Sports SRPD55 Watch",
         "fr":"Montre Seiko 5 Sports SRPD55",
         "ar":"ساعة سيكو 5 سبورتس SRPD55"
      },
      "description":{
         "en":"A robust and reliable automatic watch with a black dial and stainless steel bracelet.",
         "fr":"Une montre automatique robuste et fiable avec un cadran noir et un bracelet en acier inoxydable.",
         "ar":"ساعة أوتوماتيكية قوية وموثوقة بقرص أسود وسوار من الفولاذ المقاوم للصدأ."
      },
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
            "initialStockQuantity":125458540,
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
            "initialStockQuantity":125458535,
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
            "initialStockQuantity":125458530,
            "lowStockThreshold":6
         }
      ]
   },
   {
      "sku":"CASIO-GSHOCK-DW5600",
      "name":{
         "en":"Casio G-Shock DW-5600E-1V",
         "fr":"Casio G-Shock DW-5600E-1V",
         "ar":"كاسيو جي-شوك DW-5600E-1V"
      },
      "description":{
         "en":"The classic, ultra-tough digital watch with shock resistance and 200m water resistance.",
         "fr":"La montre numérique classique ultra-robuste avec résistance aux chocs et étanchéité à 200 m.",
         "ar":"الساعة الرقمية الكلاسيكية فائقة المتانة مع مقاومة للصدمات ومقاومة للماء حتى 200 متر."
      },
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
            "initialStockQuantity":1254585150,
            "lowStockThreshold":20
         }
      ]
   },
   {
      "sku":"LEATHERMAN-WAVE-PLUS",
      "name":{
         "en":"Leatherman Wave Plus Multi-Tool",
         "fr":"Outil multifonction Leatherman Wave Plus",
         "ar":"أداة ليذرمان ويف بلس المتعددة"
      },
      "description":{
         "en":"The internationally best-selling multi-tool, with 18 tools including pliers and replaceable wire cutters.",
         "fr":"L'outil multifonction le plus vendu au monde, avec 18 outils, dont des pinces et des coupe-fils remplaçables.",
         "ar":"الأداة المتعددة الأكثر مبيعًا عالميًا، مع 18 أداة بما في ذلك الكماشة وقواطع الأسلاك القابلة للاستبدال."
      },
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
            "initialStockQuantity":125458575,
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
            "initialStockQuantity":125458560,
            "lowStockThreshold":8
         }
      ]
   }
]

const categories = [
   { "name": { "en": "Electronics", "fr": "Électronique", "ar": "إلكترونيات" }, "slug": "electronique", "imageUrl":"https://images.pexels.com/photos/25839643/pexels-photo-25839643.jpeg" },
   { "name": { "en": "Fashion", "fr": "Mode", "ar": "أزياء" }, "slug": "mode" , "imageUrl":"https://images.pexels.com/photos/298863/pexels-photo-298863.jpeg"},
   { "name": { "en": "Home & Kitchen", "fr": "Maison & Cuisine", "ar": "المنزل والمطبخ" }, "slug": "maison-cuisine" , "imageUrl":"https://images.pexels.com/photos/1599791/pexels-photo-1599791.jpeg"},
   { "name": { "en": "Health & Beauty", "fr": "Santé & Beauté", "ar": "الصحة والجمال" }, "slug": "sante-beaute", "imageUrl":"https://images.pexels.com/photos/3735655/pexels-photo-3735655.jpeg" },
   { "name": { "en": "Sports & Outdoors", "fr": "Sport & Plein air", "ar": "الرياضة والهواء الطلق" }, "slug": "sport-plein-air" , "imageUrl":"https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg"},
   { "name": { "en": "Toys & Games", "fr": "Jouets & Jeux", "ar": "الألعاب والدمى" }, "slug": "jouets-jeux", "imageUrl":"https://images.pexels.com/photos/1329644/pexels-photo-1329644.jpeg" },
   { "name": { "en": "Books & Stationery", "fr": "Livres & Papeterie", "ar": "الكتب والقرطاسية" }, "slug": "livres-papeterie" , "imageUrl":"https://images.pexels.com/photos/632470/pexels-photo-632470.jpeg"},
   { "name": { "en": "Shoes", "fr": "Chaussures", "ar": "أحذية" }, "slug": "chaussures" , "imageUrl":"https://images.pexels.com/photos/267320/pexels-photo-267320.jpeg"},
   { "name": { "en": "Accessories", "fr": "Accessoires", "ar": "إكسسوارات" }, "slug": "accessoires" , "imageUrl":"https://images.pexels.com/photos/157888/fashion-glasses-go-pro-female-157888.jpeg"},
   { "name": { "en": "Office Supplies", "fr": "Fournitures de bureau", "ar": "لوازم مكتبية" }, "slug": "fournitures-bureau" , "imageUrl":"https://images.pexels.com/photos/6325902/pexels-photo-6325902.jpeg"},
   { "name": { "en": "Smartphones", "fr": "Smartphones", "ar": "هواتف ذكية" }, "slug": "smartphones", "parentSlug": "electronique" , "imageUrl":"https://images.pexels.com/photos/8066712/pexels-photo-8066712.png"},
   { "name": { "en": "Laptops", "fr": "Ordinateurs Portables", "ar": "أجهزة الكمبيوتر المحمولة" }, "slug": "ordinateurs-portables", "parentSlug": "electronique", "imageUrl":"https://images.pexels.com/photos/3183190/pexels-photo-3183190.jpeg" },
   { "name": { "en": "Electronic Accessories", "fr": "Accessoires Électroniques", "ar": "ملحقات إلكترونية" }, "slug": "accessoires-electroniques", "parentSlug": "electronique" , "imageUrl":"https://images.pexels.com/photos/11894047/pexels-photo-11894047.jpeg"},
   { "name": { "en": "Men's Clothing", "fr": "Vêtements homme", "ar": "ملابس رجالية" }, "slug": "vetements-homme", "parentSlug": "mode" , "imageUrl":"https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg"},
   { "name": { "en": "Kids' Clothing", "fr": "Vêtements enfant", "ar": "ملابس أطفال" }, "slug": "vetements-enfant", "parentSlug": "mode" , "imageUrl":"https://images.pexels.com/photos/1620760/pexels-photo-1620760.jpeg"},
   { "name": { "en": "Furniture", "fr": "Meubles", "ar": "أثاث" }, "slug": "meubles", "parentSlug": "maison-cuisine" , "imageUrl":"https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg"},
   { "name": { "en": "Kitchen Utensils", "fr": "Ustensiles de Cuisine", "ar": "أدوات المطبخ" }, "slug": "ustensiles-cuisine", "parentSlug": "maison-cuisine", "imageUrl":"https://images.pexels.com/photos/211760/pexels-photo-211760.jpeg" },
   { "name": { "en": "Skincare", "fr": "Soins de la peau", "ar": "العناية بالبشرة" }, "slug": "soins-peau", "parentSlug": "sante-beaute", "imageUrl":"https://images.pexels.com/photos/2442898/pexels-photo-2442898.jpeg" },
   { "name": { "en": "Makeup", "fr": "Maquillage", "ar": "مكياج" }, "slug": "maquillage", "parentSlug": "sante-beaute" , "imageUrl":"https://images.pexels.com/photos/301367/pexels-photo-301367.jpeg"},
   { "name": { "en": "Sportswear", "fr": "Vêtements de sport", "ar": "ملابس رياضية" }, "slug": "vetements-sport", "parentSlug": "sport-plein-air" , "imageUrl":"https://media.istockphoto.com/id/466367844/photo/clothes-make-running.jpg?s=1024x1024&w=is&k=20&c=sHJhf4AhE-BoUwGWqcbDkiiiumyYBoTiioMb29EeVx8="},
   { "name": { "en": "Camping Gear", "fr": "Matériel de camping", "ar": "معدات التخييم" }, "slug": "materiel-camping", "parentSlug": "sport-plein-air", "imageUrl":"https://images.pexels.com/photos/45241/tent-camp-night-star-45241.jpeg" },
   { "name": { "en": "Board Games", "fr": "Jeux de société", "ar": "ألعاب لوحية" }, "slug": "jeux-societe", "parentSlug": "jouets-jeux", "imageUrl":"https://images.pexels.com/photos/776654/pexels-photo-776654.jpeg" },
   { "name": { "en": "Educational Toys", "fr": "Jouets éducatifs", "ar": "ألعاب تعليمية" }, "slug": "jouets-educatifs", "parentSlug": "jouets-jeux", "imageUrl":"https://images.pexels.com/photos/256417/pexels-photo-256417.jpeg" },
   { "name": { "en": "School Supplies", "fr": "Fournitures scolaires", "ar": "لوازم مدرسية" }, "slug": "fournitures-scolaires", "parentSlug": "livres-papeterie", "imageUrl":"https://images.pexels.com/photos/2831794/pexels-photo-2831794.jpeg" },
   { "name": { "en": "Art Supplies", "fr": "Matériel d’art", "ar": "لوازم فنية" }, "slug": "materiel-art", "parentSlug": "livres-papeterie" , "imageUrl":"https://images.pexels.com/photos/102127/pexels-photo-102127.jpeg"},
   { "name": { "en": "Bags", "fr": "Sacs", "ar": "حقائب" }, "slug": "sacs", "parentSlug": "accessoires", "imageUrl":"https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg" },
   { "name": { "en": "Jewelry", "fr": "Bijoux", "ar": "مجوهرات" }, "slug": "bijoux", "parentSlug": "accessoires" , "imageUrl":"https://images.pexels.com/photos/10976655/pexels-photo-10976655.jpeg"},
   { "name": { "en": "Desks & Chairs", "fr": "Bureaux & chaises", "ar": "مكاتب وكراسي" }, "slug": "bureaux-chaises", "parentSlug": "fournitures-bureau" , "imageUrl":"https://images.pexels.com/photos/2349211/pexels-photo-2349211.jpeg"},
   { "name": { "en": "Monitors", "fr": "Moniteurs", "ar": "شاشات" }, "slug": "moniteurs", "parentSlug": "fournitures-bureau" , "imageUrl":"https://images.pexels.com/photos/1714202/pexels-photo-1714202.jpeg"}
]

module.exports = {
   products,
   categories,
};