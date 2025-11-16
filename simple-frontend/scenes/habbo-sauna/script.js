        // Configuration
        const SERVER_URL = 'http://localhost:8080';
        const USER_ID = 'user_001';
        let selected = null;
        const itemIcons = {
            kiuas: '🔥',
            lauteet: '🪑',
            generic: '🍺',
            saunakauha: '🥄',
            kiulu: '🪣'
        };
        const LayerTypeIds = [
            'background',
            'lauteet',
            'kiulu',
            'kiuas',
            'generic'
        ]
        const layers = [
            { id: 'layer0', src: 'habbo_sauna_room.png', type: 'background' },
            { id: 'layer1', src: '', type: 'lauteet' },
            { id: 'layer2', src: '', type: 'kiulu' },
            { id: 'layer3', src: '', type: 'kiuas' },
            { id: 'layer4', src: '', type: 'generic' }
        ];

        // Canvas setup
        const canvas = document.getElementById('mainCanvas');
        const ctx = canvas.getContext('2d');

        // Store loaded images
        const images = {};
        let imagesLoaded = 0;
        let imgRatio = 1;
        let canvasWidth = window.innerWidth - 300;
        let canvasHeight = window.innerHeight;
        let ownedItems = [];
        let allItems = [];
        // Load all images
        function loadImages() {
            imagesLoaded = 0;
            images['layer1'] = null;
            images['layer2'] = null;
            images['layer3'] = null;
            images['layer4'] = null;
            expectedImages = layers.filter(layer => layer.src!=='').length;
            layers.forEach(async (layer, index) => {

                    const img = new Image();
                    img.onload = () => {
                        //console.log('img loaded', layer.src);
                        images[layer.id] = img;
                        imagesLoaded++;
    
                        // Set canvas size based on first image
                        if (index === 0) {
                            imgRatio = img.height/img.width;
                            canvasHeight = imgRatio * canvasWidth;
                            //canvasWidth = img.width;
                            //canvasHeight = img.height;
                            canvas.width = canvasWidth;
                            canvas.height = canvasHeight;
    
                        }
                        //console.log('imagesLoaded', imagesLoaded, expectedImages);
                        if (imagesLoaded >= expectedImages) {
                            render();
                        }
    
                    };
                    img.onerror = () => {
                        console.error(`Failed to load: ${layer.src}`);
                        imagesLoaded++;
                        //console.log('imagesLoaded', imagesLoaded, expectedImages);
                        if (imagesLoaded >= expectedImages) {
                            render();
                        }
                    };
                    img.src = layer.src;
                
            });
        }

        // Render function
        function render() {
            // Clear canvas
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            //console.log('drawing layers', layers, images);
            // Draw each layer if checkbox is checked
            layers.forEach(layer => {
                if (images[layer.id]) {
                    //console.log('drawing layer', layer.id);
                    ctx.drawImage(images[layer.id], 0, 0, canvasWidth, canvasHeight);
                }
            });
        }

        window.addEventListener('resize', () => {
            canvasWidth = window.innerWidth - 300;
            canvasHeight = imgRatio * canvasWidth;
            //canvasHeight = window.innerHeight;
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            //console.log('resize', canvasWidth, canvasHeight);
            render();
        });


        async function getOwnedItems() {
            await getAllItems();
            const response = await fetch(`${SERVER_URL}/api/owned-products/user/${USER_ID}`);
            const result = await response.json();

            if (result.success) {
                for (let i =1; i < layers.length; i++) {
                    layers[i].src = '';
                }
                ownedItems = result.data;
                ownedItems.forEach(item => {
//console.log(item);
                    if (item.in_use === 1) {
                        layerId = LayerTypeIds.indexOf(item.product_type)
                        if(layerId !== -1) {
                            layers[layerId].src = item.asset_url;
                        }
                    }
                });
                updateInventory();
            }
        }

        async function getAllItems() {
            const response = await fetch(`${SERVER_URL}/api/products`);
            const result = await response.json();
            if (result.success) {
                allItems = result.data;
            }
        }
        async function purchaseItem(item) {
            const response = await fetch(`${SERVER_URL}/api/owned-products/purchase/${USER_ID}/${item.id}`, {
                method: 'POST'
            });
            const result = await response.json();
            if (result.success) {
                await getOwnedItems();
                loadImages();
            }
        }
        function log(msg) {
            const console = document.getElementById('console');
            const line = document.createElement('div');
            line.textContent = '> ' + msg;
            console.appendChild(line);
            console.scrollTop = console.scrollHeight;
        }

        async function toggleItem(itemId) {
            console.log('toggleItem', itemId);
            const item = allItems.find(i => i.id === itemId);
            const response = await fetch(`${SERVER_URL}/api/owned-products/${item.id}/toggle-use`, {    method: 'PUT'
            });
            const result = await response.json();
            if (result.success) {
                await getOwnedItems();
                loadImages();
            }
        }

        function updateInventory() {
            const grid = document.getElementById('itemGrid');
            grid.innerHTML = '';
            
            allItems.forEach(item => {
                const ownedItem = ownedItems.find(i => i.product_id === item.id);
                console.log('ownedItem', ownedItem, item);
                const isOwned = ownedItem ? true : false;

                const div = document.createElement('div');
                div.className = `item-card ${isOwned ? '' : 'locked'} ${selected === item.id ? 'selected' : ''}`;
                
                const icon = isOwned ? itemIcons[item.item_type] : '🔒';
                item.rarity= 'common';
                console.log("iuse", (ownedItem?.in_use ?? 0));
                div.innerHTML = `
                    <div class="item-icon" style="font-size: 30px; line-height: 50px;">${icon}</div>
                    <div class="item-name">${isOwned ? item.name+item.id : '???'}</div>
                    ${isOwned ? `<div class="rarity ${item.rarity}">
                        ${item.rarity.toUpperCase()}
                        <button class="btn" style="${(ownedItem?.in_use ?? 0) === 1 ? 'background-color:red' : 'background-color:green'}; font-size: 8px; padding: 4px; margin: 5px 0 0 0;" onclick="toggleItem(${item.id})">${(ownedItem?.in_use ?? 0) === 1 ? 'REMOVE' : 'INSTALL'}</button>
                        </div>` : 
                        `<div style="font-size: 10px; color: #f39c12; margin-top: 5px;">💰 ${item.price}</div>
                         <button class="btn" style="font-size: 8px; padding: 4px; margin: 5px 0 0 0;">BUY</button>`}
                `;
                
                if (isOwned) {
                    div.onclick = () => {
                        selected = item.id;
                        console.log('selected', selected);
                        updateInventory();
                        log('SELECTED: ' + item.name);
                    };
                } else {
                    const buyBtn = div.querySelector('.btn');
                    if (buyBtn) {
                        buyBtn.onclick = async (e) => {
                            e.stopPropagation();
                            await purchaseItem(item);
                        };
                    }
                }
                
                grid.appendChild(div);
            });
        }

        async function init() {
            await getOwnedItems();
            await loadImages()
        }
        init();
