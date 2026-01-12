// --- DADOS ---
const produtos = [
    { id: 7, nome: "Rosquinha de Nata", img: "rosquinha-nata.webp" },
    { id: 2, nome: "Casadinho de Coco", img: "casadinho-coco.webp" },
    { id: 3, nome: "Casadinho de Nata", img: "casadinho-nata.webp" },
    { id: 4, nome: "Flocos", img: "flocos.webp" },
    { id: 5, nome: "Florzinha de Leite Condensado", img: "florzinha-leite-condensado.webp" },
    { id: 6, nome: "Florzinha de Leite Condensado Recheada", img: "florzinha-leite-condensado-recheada.webp" },
    { id: 1, nome: "Bambolê de Ninho", img: "bambole-ninho.webp" }
];

const MINIMO = 5; 
const PRECO = 50.00;
const FONE_WHATSAPP = "5519996511995";
let cart = JSON.parse(localStorage.getItem('oliwa_cart')) || {};

// INICIALIZAÇÃO
const grid = document.getElementById('grid-produtos');
produtos.forEach(p => {
    const el = document.createElement('div');
    el.className = 'product-card';
    el.innerHTML = `
        <div class="p-img"><img src="imagens/${p.img}" alt="${p.nome}"></div>
        <div class="p-info">
            <div class="p-title">${p.nome}</div>
            <div class="qty-box">
                <button class="btn-qty" onclick="changeQty(${p.id}, -1)">-</button>
                <input class="qty-val" id="qty-${p.id}" value="${cart[p.id] || 0}" readonly>
                <button class="btn-qty add" onclick="changeQty(${p.id}, 1)">+</button>
            </div>
        </div>`;
    grid.appendChild(el);
});

// Atualiza a barra visualmente ao carregar a página
updateCart();

// LÓGICA DO CARRINHO
function changeQty(id, delta) {
    // UX: Vibração tátil (Haptic Feedback) para dispositivos móveis
    if (navigator.vibrate) navigator.vibrate(50);

    const input = document.getElementById(`qty-${id}`);
    let val = parseInt(input.value) + delta;
    if (val < 0) val = 0;
    input.value = val;
    if (val > 0) cart[id] = val; else delete cart[id];
    
    // Pixel Event: AddToCart (apenas quando adiciona)
    if (delta > 0) {
        if(typeof fbq !== 'undefined') fbq('track', 'AddToCart', { content_ids: [id], content_type: 'product' });
    }
    updateCart();
    
    // Se o modal do carrinho estiver aberto, atualiza ele em tempo real
    if (document.getElementById('cartModal').style.display === 'flex') {
        renderCartItems();
    }
}

function updateCart() {
    let total = 0; for (let id in cart) total += cart[id];
    
    // Salva no navegador
    localStorage.setItem('oliwa_cart', JSON.stringify(cart));

    const bar = document.getElementById('cartBar');
    const totalDisplay = document.getElementById('totalDisplay');
    const statusText = document.getElementById('statusText');
    const btn = document.getElementById('btnFinish');
    const progress = document.getElementById('progressBar');
    const badge = document.getElementById('headerCartBadge');

    if (total > 0) bar.classList.add('active'); else bar.classList.remove('active');
    
    // UX: Animação de "Pulso" na barra para chamar atenção quando atualiza
    bar.classList.remove('pulse');
    void bar.offsetWidth; // Trigger reflow para reiniciar animação
    bar.classList.add('pulse');
    
    document.getElementById('cxCount').innerText = total;
    document.getElementById('kgCount').innerText = total * 2;
    
    // Atualiza singular/plural da unidade abaixo do preço
    if(document.getElementById('cxUnit')) document.getElementById('cxUnit').innerText = total === 1 ? 'caixa' : 'caixas';

    totalDisplay.innerText = `R$ ${(total * PRECO).toFixed(2).replace('.', ',')}`;

    // Atualiza Badge do Header
    if(badge) {
        badge.innerText = total;
        badge.style.display = total > 0 ? 'flex' : 'none';
    }

    const pct = Math.min((total / MINIMO) * 100, 100);
    progress.style.width = pct + '%';

    if (total < MINIMO) {
        const missing = MINIMO - total;
        const suffix = missing === 1 ? 'caixa' : 'caixas';
        const verb = missing === 1 ? 'Falta' : 'Faltam';
        statusText.innerText = `${verb} ${missing} ${suffix} para o mínimo`;
        statusText.style.color = '#E65100';
        progress.style.backgroundColor = '#E65100';
        btn.className = 'btn-finish locked';
        btn.innerHTML = `${verb} ${missing} ${suffix}`;
        btn.disabled = true;
    } else {
        statusText.innerText = `Pedido mínimo atingido!`;
        statusText.style.color = '#25D366';
        progress.style.backgroundColor = '#25D366';
        btn.className = 'btn-finish active';
        btn.innerHTML = `Finalizar Pedido`;
        btn.disabled = false;
    }
}

function tryCheckout() {
    let total = 0; for (let id in cart) total += cart[id];
    if (total >= MINIMO) {
        // Agora abre o Resumo primeiro
        renderCartItems();
        document.getElementById('cartModal').style.display = 'flex';
    }
}

function openCartFromHeader() {
    renderCartItems();
    document.getElementById('cartModal').style.display = 'flex';
}

// --- NOVA LÓGICA DO MODAL DE CARRINHO ---
function renderCartItems() {
    const list = document.getElementById('cartItemsList');
    list.innerHTML = "";
    
    let totalGeral = 0;

    for (let id in cart) {
        const p = produtos.find(x => x.id == id);
        const qtd = cart[id];
        totalGeral += qtd * PRECO;

        const item = document.createElement('div');
        item.className = 'cart-item';
        
        item.innerHTML = `
            <div class="cart-item-left">
                <img src="imagens/${p.img}" class="cart-item-img" onerror="this.src='https://placehold.co/50x50'">
                <div class="cart-item-info">
                    <div class="cart-item-title">${p.nome}</div>
                    <div class="cart-item-price">R$ ${(qtd * PRECO).toFixed(2)}</div>
                </div>
            </div>
            <div class="qty-box" style="transform:scale(0.9);">
                <button class="btn-qty" onclick="changeQty(${p.id}, -1)">-</button>
                <input class="qty-val" value="${qtd}" readonly style="width:30px;">
                <button class="btn-qty add" onclick="changeQty(${p.id}, 1)">+</button>
            </div>
        `;
        list.appendChild(item);
    }

    // Validação do botão de confirmar dentro do modal
    const btnConfirm = document.getElementById('btnCartConfirm');
    let totalItens = 0; for(let i in cart) totalItens += cart[i];
    
    if(totalItens < MINIMO) {
        btnConfirm.style.opacity = '0.5';
        btnConfirm.innerHTML = `Mínimo ${MINIMO} caixas`;
    } else {
        btnConfirm.style.opacity = '1';
        btnConfirm.innerHTML = `Confirmar e Avançar`;
    }
}

function closeCart() { document.getElementById('cartModal').style.display = 'none'; }
function goToCheckout() {
    closeCart();
    
    // Verificação extra de segurança
    let total = 0; for (let id in cart) total += cart[id];
    if (total < MINIMO) {
        alert(`O pedido mínimo é de ${MINIMO} caixas.`);
        return;
    }

    document.getElementById('checkoutModal').style.display = 'flex';
    
    // Pixel: Envia valor estimado já no início do checkout para otimizar público
    if(typeof fbq !== 'undefined') {
        fbq('track', 'InitiateCheckout', {
            value: total * PRECO,
            currency: 'BRL',
            num_items: total,
            content_ids: Object.keys(cart),
            content_type: 'product'
        });
    }
}

function closeModal() { document.getElementById('checkoutModal').style.display = 'none'; }
function closeDelivery() { document.getElementById('deliveryModal').style.display = 'none'; }

// --- VIACEP INTEGRAÇÃO ---
function mascaraCep(t) {
    t.value = t.value.replace(/\D/g,"").replace(/^(\d{5})(\d)/,"$1-$2");
}

function mascaraCNPJ(t) {
    let v = t.value.replace(/\D/g,"");
    v = v.replace(/^(\d{2})(\d)/,"$1.$2");
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/,"$1.$2.$3");
    v = v.replace(/\.(\d{3})(\d)/,".$1/$2");
    v = v.replace(/(\d{4})(\d)/,"$1-$2");
    t.value = v;
}

function mascaraFone(t) {
    let v = t.value.replace(/\D/g,"");
    v = v.replace(/^(\d{2})(\d)/g,"($1) $2");
    v = v.replace(/(\d)(\d{4})$/,"$1-$2");
    t.value = v;
}

function buscarCep(cep) {
    cep = cep.replace(/\D/g, '');
    if(cep.length === 8) {
        // Feedback visual de carregamento
        document.getElementById('rua').value = "...";
        document.getElementById('bairro').value = "...";
        document.getElementById('cidade').value = "...";

        fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(res => res.json())
        .then(data => {
            if(!data.erro) {
                document.getElementById('rua').value = data.logradouro;
                document.getElementById('bairro').value = data.bairro;
                document.getElementById('cidade').value = `${data.localidade} - ${data.uf}`;
                document.getElementById('numero').focus(); // Pula pro numero
            } else {
                alert("CEP não encontrado.");
                // Limpa pra pessoa digitar
                document.getElementById('rua').value = "";
                document.getElementById('rua').readOnly = false;
                document.getElementById('bairro').value = "";
                document.getElementById('bairro').readOnly = false;
                document.getElementById('cidade').value = "";
                document.getElementById('cidade').readOnly = false;
            }
        })
        .catch(() => alert("Erro ao buscar CEP."));
    }
}

// --- LÓGICA DE AGENDAMENTO ---
const ROTA_DIAS = {
    'Americana': 2, 'Santa Bárbara': 2, // Terça (2)
    'Nova Odessa': 3, 'Sumaré': 3,      // Quarta (3)
    'Piracicaba': 4,                    // Quinta (4)
    'Paulínia': 5, 'Campinas': 5        // Sexta (5)
};

// Função auxiliar para preencher as datas (Reutilizável)
function fillDeliveryDates(cidadeFull) {
    let diaRota = null;
    for (let cidadeKey in ROTA_DIAS) {
        if (cidadeFull.includes(cidadeKey)) {
            diaRota = ROTA_DIAS[cidadeKey];
            break;
        }
    }

    const selectDate = document.getElementById('deliveryDate');
    selectDate.innerHTML = ""; 
    const regionDisplay = document.getElementById('regionDisplay');

    if (diaRota !== null) {
        regionDisplay.innerText = cidadeFull.split('-')[0].trim();
        let count = 0;
        let checkDate = new Date();
        while(count < 4) {
            checkDate.setDate(checkDate.getDate() + 1);
            if (checkDate.getDay() === diaRota) {
                const diaStr = checkDate.toLocaleDateString('pt-BR');
                const opt = document.createElement('option');
                opt.value = diaStr;
                opt.innerText = `${diaStr} (${getDiaSemana(diaRota)})`;
                selectDate.appendChild(opt);
                count++;
            }
        }
    } else {
        regionDisplay.innerText = "Outra Região";
        const opt = document.createElement('option');
        opt.value = "A combinar";
        opt.innerText = "Data a combinar no WhatsApp";
        selectDate.appendChild(opt);
    }
}

function goToDelivery() {
    // 1. Validação Básica
    const resp = document.getElementById('respName').value;
    const shop = document.getElementById('shopName').value;
    const phone = document.getElementById('clientPhone').value;
    const rua = document.getElementById('rua').value;
    const num = document.getElementById('numero').value;

    if (!resp || !shop || !phone || !rua || !num) {
        alert('Preencha os dados obrigatórios (Nome, Loja, WhatsApp e Endereço).');
        return;
    }

    // 2. Identificar Cidade e Dia da Rota
    fillDeliveryDates(document.getElementById('cidade').value);

    // 4. Troca de Modal
    document.getElementById('checkoutModal').style.display = 'none';
    document.getElementById('deliveryModal').style.display = 'flex';

    // Garante que os botões estão configurados para PEDIDO NORMAL
    const btnSend = document.getElementById('btnDeliverySend');
    btnSend.setAttribute('onclick', 'sendWhatsapp()');
    btnSend.innerHTML = 'Enviar Pedido';
    
    const btnBack = document.getElementById('btnDeliveryBack');
    btnBack.setAttribute('onclick', 'backToData()');
}

function backToData() {
    document.getElementById('deliveryModal').style.display = 'none';
    document.getElementById('checkoutModal').style.display = 'flex';
}

function getDiaSemana(n) {
    const dias = ['Dom','Seg','Terça','Quarta','Quinta','Sexta','Sáb'];
    return dias[n];
}

function sendWhatsapp() {
    // Coleta dados do Modal 1
    const resp = document.getElementById('respName').value;
    const shop = document.getElementById('shopName').value;
    const phone = document.getElementById('clientPhone').value;
    const cnpj = document.getElementById('cnpj').value || "Não informado";
    const rua = document.getElementById('rua').value;
    const num = document.getElementById('numero').value;
    const bairro = document.getElementById('bairro').value;
    const cidade = document.getElementById('cidade').value;
    const cep = document.getElementById('cep').value;

    // Coleta dados do Modal 2
    const dataEntrega = document.getElementById('deliveryDate').value;
    const periodo = document.getElementById('deliveryTime').value;

    let msg = `*NOVO PEDIDO OLIWA (SITE)* 🍪\n\n`;
    msg += `📋 *DADOS DO CLIENTE*\n`;
    msg += `👤 Resp: *${resp}*\n`;
    msg += `🏪 Loja: *${shop}*\n`;
    msg += `📱 WhatsApp: ${phone}\n`;
    msg += ` CNPJ: ${cnpj}\n`;
    msg += `📍 *Endereço de Entrega:*\n`;
    msg += `${rua}, ${num}\n`;
    msg += `${bairro} - ${cidade}\n`;
    msg += `CEP: ${cep}\n`;
    msg += `----------------------------------\n`;
    msg += `🚚 *ENTREGA AGENDADA*\n`;
    msg += `📅 Data: *${dataEntrega}*\n`;
    msg += `⏰ Período: ${periodo}\n`;
    msg += `----------------------------------\n`;
    msg += `🛒 *RESUMO DO PEDIDO*\n\n`;

    let totalBoxes = 0;
    for (let id in cart) {
        const p = produtos.find(x => x.id == id);
        const qtd = cart[id];
        msg += `▪️ *${qtd}cx* - ${p.nome}\n   Subtotal: R$ ${(qtd*PRECO).toFixed(2)}\n`;
        totalBoxes += qtd;
    }

    msg += `----------------------------------\n`;
    msg += `📦 Total Caixas: *${totalBoxes}*\n`;
    msg += `💰 *VALOR FINAL: R$ ${(totalBoxes*PRECO).toFixed(2).replace('.', ',')}*\n\n`;
    msg += `_Aguardo confirmação._`;

    // --- INTEGRAÇÃO DE DADOS (MVP) ---
    // Prepara o objeto para salvar em Planilha/CRM futuramente
    const orderData = {
        data: new Date().toISOString(),
        cliente: { nome: resp, loja: shop, cnpj: cnpj, telefone: phone },
        endereco: { rua, num, bairro, cidade, cep, data_entrega: dataEntrega, periodo: periodo },
        pedido: [],
        total_caixas: totalBoxes,
        valor_total: totalBoxes * PRECO
    };

    for (let id in cart) {
        const p = produtos.find(x => x.id == id);
        orderData.pedido.push({ produto: p.nome, qtd: cart[id] });
    }

    // --- INTEGRAÇÃO COM A PLANILHA ---
    const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwmb4WkU8igBDN0VwpGtW7plyJCO3GIh0Brpj6FJ41W5qZMnpq9IbnuPKlI1JU0M8vR/exec';

    // Feedback visual no botão para o cliente não clicar duas vezes
    const btn = document.querySelector('button[onclick="sendWhatsapp()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = "Processando pedido...";
    btn.disabled = true;

    fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors', // Essencial para o Google Script
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
    })
    .then(() => {
        // Dispara o Pixel de Compra se o Facebook Ads estiver ativo
        if(typeof fbq !== 'undefined') {
            // Envia também os IDs dos produtos para inteligência do Pixel
            const content_ids = Object.keys(cart);
            fbq('track', 'Purchase', { 
                value: orderData.valor_total, 
                currency: 'BRL',
                content_ids: content_ids,
                content_type: 'product',
                num_items: orderData.total_caixas // Importante para relatórios
            });
        }
        
        // Abre o WhatsApp
        window.open(`https://wa.me/${FONE_WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
        
        // Limpa o carrinho e localStorage
        cart = {};
        updateCart(); // Atualiza a barra inferior
        localStorage.removeItem('oliwa_cart'); // Remove do armazenamento
        document.querySelectorAll('.qty-val').forEach(input => input.value = 0); // Zera os inputs

        // Restaura o botão e fecha o modal
        btn.innerHTML = originalText;
        btn.disabled = false;
        closeDelivery();
    })
    .catch(err => {
        console.error("Erro ao salvar:", err);
        // Mesmo se a planilha falhar, abrimos o WhatsApp para não perder a venda
        window.open(`https://wa.me/${FONE_WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
        
        // Limpa o carrinho também no caso de erro (fallback)
        cart = {};
        updateCart();
        localStorage.removeItem('oliwa_cart');
        document.querySelectorAll('.qty-val').forEach(input => input.value = 0);

        btn.innerHTML = originalText;
        btn.disabled = false;
    });
}

// --- LÓGICA DE DEGUSTAÇÃO ---
function buscarCepTasting(cep) {
    cep = cep.replace(/\D/g, '');
    if(cep.length === 8) {
        document.getElementById('tastRua').value = "...";
        document.getElementById('tastBairro').value = "...";
        document.getElementById('tastCity').value = "...";

        fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(res => res.json())
        .then(data => {
            if(!data.erro) {
                document.getElementById('tastRua').value = data.logradouro;
                document.getElementById('tastBairro').value = data.bairro;
                document.getElementById('tastCity').value = `${data.localidade} - ${data.uf}`;
                document.getElementById('tastNum').focus();
            } else {
                alert("CEP não encontrado.");
                document.getElementById('tastRua').value = "";
                document.getElementById('tastRua').readOnly = false;
                document.getElementById('tastBairro').value = "";
                document.getElementById('tastBairro').readOnly = false;
                document.getElementById('tastCity').value = "";
                document.getElementById('tastCity').readOnly = false;
            }
        })
        .catch(() => alert("Erro ao buscar CEP."));
    }
}

function openTastingModal() {
    document.getElementById('tastingModal').style.display = 'flex';
}
function closeTastingModal() {
    document.getElementById('tastingModal').style.display = 'none';
}

function goToTastingDelivery() {
    const nome = document.getElementById('tastName').value;
    const loja = document.getElementById('tastShop').value;
    const fone = document.getElementById('tastPhone').value;
    const rua = document.getElementById('tastRua').value;
    const num = document.getElementById('tastNum').value;
    const cidade = document.getElementById('tastCity').value;

    if(!nome || !loja || !fone || !rua || !num || !cidade) {
        alert("Por favor, preencha os campos obrigatórios (Nome, Loja, WhatsApp e Endereço).");
        return;
    }

    fillDeliveryDates(cidade);

    document.getElementById('tastingModal').style.display = 'none';
    document.getElementById('deliveryModal').style.display = 'flex';

    // Configura botões para DEGUSTAÇÃO
    const btnSend = document.getElementById('btnDeliverySend');
    btnSend.setAttribute('onclick', 'sendTastingRequest()');
    btnSend.innerHTML = 'Solicitar Degustação';

    const btnBack = document.getElementById('btnDeliveryBack');
    btnBack.setAttribute('onclick', 'backToTasting()');
}

function backToTasting() {
    document.getElementById('deliveryModal').style.display = 'none';
    document.getElementById('tastingModal').style.display = 'flex';
}

function sendTastingRequest() {
    const nome = document.getElementById('tastName').value;
    const loja = document.getElementById('tastShop').value;
    const fone = document.getElementById('tastPhone').value;
    const cnpj = document.getElementById('tastCnpj').value;
    const cep = document.getElementById('tastCep').value;
    const rua = document.getElementById('tastRua').value;
    const num = document.getElementById('tastNum').value;
    const bairro = document.getElementById('tastBairro').value;
    const cidade = document.getElementById('tastCity').value;

    const dataEntrega = document.getElementById('deliveryDate').value;
    const periodo = document.getElementById('deliveryTime').value;

    // Monta objeto compatível com a planilha existente
    // Usamos o campo 'pedido' para indicar que é uma degustação
    const tastingData = {
        data: new Date().toISOString(),
        status: "DEGUSTACAO", // Campo extra para facilitar filtro se o script suportar
        cliente: { nome: nome, loja: loja, cnpj: cnpj || "Não informado", telefone: fone },
        endereco: { rua: rua, num: num, bairro: bairro, cidade: cidade, cep: cep, data_entrega: dataEntrega, periodo: periodo },
        pedido: [{ produto: ">>> SOLICITAÇÃO DE DEGUSTAÇÃO <<<", qtd: 1 }],
        total_caixas: 0,
        valor_total: 0
    };

    const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwmb4WkU8igBDN0VwpGtW7plyJCO3GIh0Brpj6FJ41W5qZMnpq9IbnuPKlI1JU0M8vR/exec';
    
    const btn = document.getElementById('btnDeliverySend');
    const originalText = btn.innerHTML;
    btn.innerHTML = "Enviando...";
    btn.disabled = true;

    fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tastingData)
    })
    .then(() => {
        // Pixel Event: Lead (Solicitação de Degustação)
        if(typeof fbq !== 'undefined') fbq('track', 'Lead');

        alert("Solicitação enviada com sucesso! Entraremos em contato.");
        closeDelivery(); // Fecha o modal de entrega agora
        btn.innerHTML = originalText;
        btn.disabled = false;
        
        // Opcional: Enviar msg no Zap também para garantir
        const msg = `Olá, sou ${nome} da ${loja} (${cidade}) e gostaria de solicitar uma visita de degustação para *${dataEntrega}* (${periodo}).`;
        window.open(`https://wa.me/${FONE_WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
    })
    .catch(() => {
        alert("Erro ao enviar. Tente pelo WhatsApp.");
        btn.innerHTML = originalText;
        btn.disabled = false;
    });
}

document.getElementById('cartModal').addEventListener('click', (e) => {
    if(e.target.id === 'cartModal') closeCart();
});
document.getElementById('checkoutModal').addEventListener('click', (e) => {
    if(e.target.id === 'checkoutModal') closeModal();
});
document.getElementById('deliveryModal').addEventListener('click', (e) => {
    if(e.target.id === 'deliveryModal') closeDelivery();
});
document.getElementById('tastingModal').addEventListener('click', (e) => {
    if(e.target.id === 'tastingModal') closeTastingModal();
});

// --- GESTO DE DESLIZAR PARA FECHAR (SWIPE DOWN) ---
const cartBar = document.getElementById('cartBar');
let touchStartY = 0;

cartBar.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
}, {passive: true});

cartBar.addEventListener('touchmove', (e) => {
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    if(diff > 0) { // Arrastando para baixo
        cartBar.style.transform = `translateY(${diff}px)`;
    }
}, {passive: true});

cartBar.addEventListener('touchend', (e) => {
    const currentY = e.changedTouches[0].clientY;
    if(currentY - touchStartY > 50) { // Se arrastou mais de 50px
        cartBar.classList.remove('active'); // Esconde
        cartBar.style.transform = ''; // Limpa o estilo inline para o CSS assumir
    } else {
        cartBar.style.transform = ''; // Volta para o lugar (efeito elástico)
    }
});