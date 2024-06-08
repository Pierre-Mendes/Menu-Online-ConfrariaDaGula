$(document).ready(function () {
    cardapio.eventos.init();
});

const cardapio = {
    VALOR_CARRINHO: 0,
};

let MEU_CARRINHO = [];
let MEU_ENDERECO = null;
let CLIENTE_RETIRADA = "Retirada de Pedido!";
let CLIENTE_ENTREGA = "Entrega de Pedido!";

const CELULAR_EMPRESA = "5534999648678";

const debounce = (func, delay) => {
    let debounceTimer;
    return function (...args) {
        const context = this;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
};

cardapio.eventos = {
    init: () => {
        cardapio.metodos.obterItensCardapio();
        cardapio.metodos.carregarBotaoLigar();
        cardapio.metodos.carregarBotaoReserva();
        cardapio.metodos.carregarCarrinhoLocalStorage();

        $("#txtCEP").on("input", debounce(cardapio.metodos.buscarCep, 500));
    },
};

cardapio.metodos = {
    obterItensCardapio: (categoria = "burgers", vermais = false) => {
        const filtro = MENU[categoria];

        if (!vermais) {
            $("#itensCardapio").html("");
            $("#btnVerMais").removeClass("hidden");
        }

        const limite = vermais ? [8, 12] : [0, 8];
        filtro.slice(limite[0], limite[1]).forEach((e) => {
            const temp = cardapio.templates.item
                .replace(/\${img}/g, e.img)
                .replace(/\${nome}/g, e.name)
                .replace(/\${preco}/g, e.price.toFixed(2).replace(".", ","))
                .replace(/\${id}/g, e.id);

            $("#itensCardapio").append(temp);
        });

        $(".container-menu a").removeClass("active");
        $(`#menu-${categoria}`).addClass("active");
    },

    verMais: () => {
        const ativo = $(".container-menu a.active").attr("id").split("menu-")[1];
        cardapio.metodos.obterItensCardapio(ativo, true);
        $("#btnVerMais").addClass("hidden");
    },

    alterarQuantidade: (id, operacao) => {
        const qntdAtual = parseInt($(`#qntd-${id}`).text());
        const novaQntd =
            operacao === "aumentar" ? qntdAtual + 1 : Math.max(qntdAtual - 1, 0);
        $(`#qntd-${id}`).text(novaQntd);
    },

    adicionarAoCarrinho: (id) => {
        const qntdAtual = parseInt($(`#qntd-${id}`).text());

        if (qntdAtual > 0) {
            const categoria = $(".container-menu a.active")
                .attr("id")
                .split("menu-")[1];
            const filtro = MENU[categoria];
            const item = filtro.find((e) => e.id == id);

            if (item) {
                const existe = MEU_CARRINHO.find((elem) => elem.id == id);

                if (existe) {
                    existe.qntd += qntdAtual;
                } else {
                    item.qntd = qntdAtual;
                    MEU_CARRINHO.push(item);
                }

                cardapio.metodos.mensagem("Item adicionado ao carrinho", "green");
                $(`#qntd-${id}`).text(0);

                cardapio.metodos.atualizarBadgeTotal();
                cardapio.metodos.carregarCarrinho();
                cardapio.metodos.salvarCarrinhoLocalStorage();
            }
        }
    },

    atualizarBadgeTotal: () => {
        const total = MEU_CARRINHO.reduce((acc, e) => acc + e.qntd, 0);

        if (total > 0) {
            $(".botao-carrinho, .container-total-carrinho").removeClass("hidden");
        } else {
            $(".botao-carrinho, .container-total-carrinho").addClass("hidden");
        }

        $(".badge-total-carrinho").html(total);
    },

    abrirCarrinho: (abrir) => {
        if (abrir) {
            $("#modalCarrinho").removeClass("hidden");
            cardapio.metodos.carregarCarrinho();
        } else {
            $("#modalCarrinho").addClass("hidden");
        }
    },

    carregarEtapa: (etapa) => {
        const etapas = [
            {
                titulo: "Seu carrinho:",
                mostrar: ["#itensCarrinho"],
                esconder: [
                    "#localEntrega",
                    "#resumoCarrinho",
                    "#escolhaRetiradaEntrega",
                    "#mensagemRetirada",
                ],
            },
            {
                titulo: "Escolha Retirada ou Entrega:",
                mostrar: ["#escolhaRetiradaEntrega"],
                esconder: [
                    "#itensCarrinho",
                    "#localEntrega",
                    "#resumoCarrinho",
                    "#mensagemRetirada",
                ],
            },
            {
                titulo: "Tipo de Entrega:",
                mostrar: ["#localEntrega"],
                esconder: [
                    "#itensCarrinho",
                    "#escolhaRetiradaEntrega",
                    "#resumoCarrinho",
                    "#mensagemRetirada",
                ],
            },
            {
                titulo: "Resumo do pedido:",
                mostrar: ["#resumoCarrinho"],
                esconder: [
                    "#itensCarrinho",
                    "#localEntrega",
                    "#escolhaRetiradaEntrega",
                    "#mensagemRetirada",
                ],
            },
            {
                titulo: "Mensagem de Retirada:",
                mostrar: ["#mensagemRetirada", "#btnFinalizarPedido"],
                esconder: [
                    "#itensCarrinho",
                    "#localEntrega",
                    "#escolhaRetiradaEntrega",
                    "#resumoCarrinho",
                ],
            },
        ];

        const config = etapas[etapa - 1];

        $("#lblTituloEtapa").text(config.titulo);
        config.mostrar.forEach((sel) => $(sel).removeClass("hidden"));
        config.esconder.forEach((sel) => $(sel).addClass("hidden"));

        $(".etapa").removeClass("active");
        for (let i = 1; i <= etapa; i++) {
            $(`.etapa${i}`).addClass("active");
        }

        $("#btnEtapaPedido").toggleClass("hidden", etapa !== 1);
        $("#btnEtapaEndereco").toggleClass("hidden", etapa !== 3);
        $("#btnEtapaResumo").toggleClass("hidden", etapa !== 4);
        $("#btnFinalizarPedido").toggleClass("hidden", etapa !== 5);
        $("#btnVoltar").toggleClass("hidden", etapa === 1);
    },

    voltarEtapa: () => {
        const etapa = $(".etapa.active").length;
        cardapio.metodos.carregarEtapa(etapa - 1);
    },

    carregarCarrinho: () => {
        cardapio.metodos.carregarEtapa(1);

        if (MEU_CARRINHO.length > 0) {
            $("#itensCarrinho").html("");

            MEU_CARRINHO.forEach((e) => {
                const temp = cardapio.templates.itemCarrinho
                    .replace(/\${img}/g, e.img)
                    .replace(/\${nome}/g, e.name)
                    .replace(/\${preco}/g, e.price.toFixed(2).replace(".", ","))
                    .replace(/\${id}/g, e.id)
                    .replace(/\${qntd}/g, e.qntd);

                $("#itensCarrinho").append(temp);
            });

            cardapio.metodos.carregarValores();
        } else {
            $("#itensCarrinho").html(
                '<p class="carrinho-vazio"><i class="fa fa-shopping-bag"></i> Seu carrinho está vazio.</p>'
            );
            cardapio.metodos.carregarValores();
        }
    },

    alterarQuantidadeCarrinho: (id, operacao) => {
        const qntdAtual = parseInt($(`#qntd-carrinho-${id}`).text());
        const novaQntd = operacao === "aumentar" ? qntdAtual + 1 : qntdAtual - 1;

        if (novaQntd > 0) {
            $(`#qntd-carrinho-${id}`).text(novaQntd);
            cardapio.metodos.atualizarCarrinho(id, novaQntd);
        } else {
            cardapio.metodos.removerItemCarrinho(id);
        }
    },

    removerItemCarrinho: (id) => {
        MEU_CARRINHO = MEU_CARRINHO.filter((e) => e.id !== id);
        cardapio.metodos.carregarCarrinho();
        cardapio.metodos.atualizarBadgeTotal();
        cardapio.metodos.salvarCarrinhoLocalStorage();
    },

    atualizarCarrinho: (id, qntd) => {
        const item = MEU_CARRINHO.find((obj) => obj.id == id);
        if (item) {
            item.qntd = qntd;
            cardapio.metodos.atualizarBadgeTotal();
            cardapio.metodos.carregarValores();
            cardapio.metodos.salvarCarrinhoLocalStorage();
        }
    },

    carregarValores: () => {
        cardapio.VALOR_CARRINHO = MEU_CARRINHO.reduce(
            (acc, e) => acc + parseFloat(e.price * e.qntd),
            0
        );
        $("#lblSubTotal").text(
            `R$ ${cardapio.VALOR_CARRINHO.toFixed(2).replace(".", ",")}`
        );
        $("#lblValorTotal").text(
            `R$ ${cardapio.VALOR_CARRINHO.toFixed(2).replace(".", ",")}`
        );
    },

    carregarEndereco: () => {
        if (MEU_CARRINHO.length <= 0) {
            cardapio.metodos.mensagem("Seu carrinho está vazio.");
            return;
        }
        cardapio.metodos.carregarEtapa(2);
    },

    buscarCep: async () => {
        const cep = $("#txtCEP").val().trim().replace(/\D/g, "");
        const validacep = /^[0-9]{8}$/;

        if (!cep) {
            cardapio.metodos.mensagem("Informe o CEP, por favor.");
            $("#txtCEP").focus();
            return;
        }

        if (!validacep.test(cep)) {
            cardapio.metodos.mensagem("Formato do CEP inválido.");
            $("#txtCEP").focus();
            return;
        }

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const dados = await response.json();

            if (!dados.erro) {
                $("#txtEndereco").val(dados.logradouro);
                $("#txtBairro").val(dados.bairro);
                $("#txtCidade").val(dados.localidade);
                $("#ddlUf").val(dados.uf);
                $("#txtNumero").focus();
            } else {
                cardapio.metodos.mensagem(
                    "CEP não encontrado. Preencha as informações manualmente."
                );
                $("#txtEndereco").focus();
            }
        } catch (error) {
            cardapio.metodos.mensagem("Erro ao buscar o CEP. Tente novamente.");
        }
    },

    resumoPedido: () => {
        const campos = [
            { id: "#txtCEP", mensagem: "Informe o CEP, por favor." },
            { id: "#txtEndereco", mensagem: "Informe o Endereço, por favor." },
            { id: "#txtBairro", mensagem: "Informe o Bairro, por favor." },
            { id: "#txtCidade", mensagem: "Informe a Cidade, por favor." },
            { id: "#ddlUf", mensagem: "Informe a UF, por favor.", value: "-1" },
            { id: "#txtNumero", mensagem: "Informe o Número, por favor." },
        ];

        for (const campo of campos) {
            const valor = $(campo.id).val().trim();
            if (campo.value ? valor === campo.value : !valor) {
                cardapio.metodos.mensagem(campo.mensagem);
                $(campo.id).focus();
                return;
            }
        }

        MEU_ENDERECO = {
            cep: $("#txtCEP").val().trim(),
            endereco: $("#txtEndereco").val().trim(),
            bairro: $("#txtBairro").val().trim(),
            cidade: $("#txtCidade").val().trim(),
            uf: $("#ddlUf").val().trim(),
            numero: $("#txtNumero").val().trim(),
            complemento: $("#txtComplemento").val().trim(),
        };

        cardapio.metodos.carregarEtapa(4);
        cardapio.metodos.carregarResumo();
    },

    carregarResumo: () => {
        $("#listaItensResumo").html("");

        MEU_CARRINHO.forEach((e) => {
            const temp = cardapio.templates.itemResumo
                .replace(/\${img}/g, e.img)
                .replace(/\${nome}/g, e.name)
                .replace(/\${preco}/g, e.price.toFixed(2).replace(".", ","))
                .replace(/\${qntd}/g, e.qntd);

            $("#listaItensResumo").append(temp);
        });

        $("#resumoEndereco").html(
            `${MEU_ENDERECO.endereco}, ${MEU_ENDERECO.numero}, ${MEU_ENDERECO.bairro}`
        );
        $("#cidadeEndereco").html(
            `${MEU_ENDERECO.cidade}-${MEU_ENDERECO.uf} / ${MEU_ENDERECO.cep} ${MEU_ENDERECO.complemento}`
        );

        cardapio.metodos.finalizarPedido();
        cardapio.metodos.removerCarrinhoLocalStorage();
    },

    finalizarPedido: () => {
        if (MEU_CARRINHO.length > 0) {
            const itens = MEU_CARRINHO.map(
                (e) =>
                    `*${e.qntd}x* ${e.name} ....... R$ ${e.price
                        .toFixed(2)
                        .replace(".", ",")}\n`
            ).join("");

            let texto = `Olá! gostaria de fazer um pedido:\n*Itens do pedido:*\n\n${itens}`;

            if (MEU_ENDERECO) {
                texto += `\n*Tipo de entrega:*\n${CLIENTE_ENTREGA}`;
                texto += `\n\n*Endereço de entrega:*\n${MEU_ENDERECO.endereco}, ${MEU_ENDERECO.numero}, ${MEU_ENDERECO.bairro}\n${MEU_ENDERECO.cidade}-${MEU_ENDERECO.uf} / ${MEU_ENDERECO.cep} ${MEU_ENDERECO.complemento}`;
                texto += `\n\n*Total (sem valor da entrega): R$ ${cardapio.VALOR_CARRINHO.toFixed(
                    2
                ).replace(".", ",")}*`;
            } else {
                texto += `\n*Tipo de entrega:*\n${CLIENTE_RETIRADA}`;
                texto += `\n\n*Total: R$ ${cardapio.VALOR_CARRINHO.toFixed(2).replace(
                    ".",
                    ","
                )}*`;
            }

            const encode = encodeURI(texto);
            const URL = `https://wa.me/${CELULAR_EMPRESA}?text=${encode}`;

            $("#btnEtapaResumo").attr("href", URL);
            $("#btnFinalizarPedido").attr("href", URL);
        }
    },

    carregarBotaoReserva: () => {
        const texto = "Olá! gostaria de fazer uma *reserva*";
        const encode = encodeURI(texto);
        const URL = `https://wa.me/${CELULAR_EMPRESA}?text=${encode}`;

        $("#btnReserva").attr("href", URL);
    },

    carregarBotaoLigar: () => {
        $("#btnLigar").attr("href", `tel:${CELULAR_EMPRESA}`);
    },

    abrirDepoimento: (depoimento) => {
        for (let i = 1; i <= 3; i++) {
            $(`#depoimento-${i}`).addClass("hidden");
            $(`#btnDepoimento-${i}`).removeClass("active");
        }

        $(`#depoimento-${depoimento}`).removeClass("hidden");
        $(`#btnDepoimento-${depoimento}`).addClass("active");
    },

    mensagem: (texto, cor = "red", tempo = 3500) => {
        const id = Math.floor(Date.now() * Math.random()).toString();
        const msg = `<div id="msg-${id}" class="animated fadeInDown toast ${cor}">${texto}</div>`;

        $("#container-mensagens").append(msg);

        setTimeout(() => {
            $(`#msg-${id}`).removeClass("fadeInDown").addClass("fadeOutUp");
            setTimeout(() => $(`#msg-${id}`).remove(), 800);
        }, tempo);
    },

    salvarCarrinhoLocalStorage: () => {
        localStorage.setItem("MEU_CARRINHO", JSON.stringify(MEU_CARRINHO));
    },

    removerCarrinhoLocalStorage: () => {
        localStorage.removeItem("MEU_CARRINHO");
    },

    carregarCarrinhoLocalStorage: () => {
        const carrinho = localStorage.getItem("MEU_CARRINHO");
        if (carrinho) {
            MEU_CARRINHO = JSON.parse(carrinho);
            cardapio.metodos.atualizarBadgeTotal();
            cardapio.metodos.carregarCarrinho();
        }
    },

    escolherRetirada: () => {
        cardapio.metodos.carregarEtapa(5);
    },

    escolherEntrega: () => {
        cardapio.metodos.carregarEtapa(3);
    },
};

function mostrarDetalhes() {
    // Aqui você pode obter os detalhes do produto clicado e atualizar o conteúdo da modal
    var nomeProduto = "Nome do Produto";
    var descricao = "Descrição detalhada do produto.";
    var caracteristicas = "Características do produto.";

    // Atualiza o conteúdo da modal
    document.getElementById("nomeProdutoModal").innerText = nomeProduto;
    document.getElementById("descricaoModal").innerText = descricao;
    document.getElementById("caracteristicasModal").innerText = caracteristicas;

    // Abre a modal
    $("#detalhesModal").modal("show");
};

cardapio.templates = {
    item: `
        <div class="col-12 col-lg-3 col-md-3 col-sm-6 mb-5 animated fadeInUp">
            <div class="card card-item" id="\${id}">
                <div class="img-produto">
                    <img src="\${img}" />
                </div>
                <p class="title-produto text-center mt-4"><b>\${nome}</b></p>
                <p class="price-produto text-center"><b>R$ \${preco}</b></p>
                <div class="add-carrinho">
                    <span class="btn-menos" onclick="cardapio.metodos.alterarQuantidade('\${id}', 'diminuir')"><i class="fas fa-minus"></i></span>
                    <span class="add-numero-itens" id="qntd-\${id}">0</span>
                    <span class="btn-mais" onclick="cardapio.metodos.alterarQuantidade('\${id}', 'aumentar')"><i class="fas fa-plus"></i></span>
                    <span class="btn btn-add" onclick="cardapio.metodos.adicionarAoCarrinho('\${id}')"><i class="fa fa-shopping-bag"></i></span>
                </div>
            </div>
        </div>
    `,

    itemCarrinho: `
        <div class="col-12 item-carrinho">
            <div class="img-produto">
                <img src="\${img}" />
            </div>
            <div class="dados-produto">
                <p class="title-produto"><b>\${nome}</b></p>
                <p class="price-produto"><b>R$ \${preco}</b></p>
            </div>
            <div class="add-carrinho">
                <span class="btn-menos" onclick="cardapio.metodos.alterarQuantidadeCarrinho('\${id}', 'diminuir')"><i class="fas fa-minus"></i></span>
                <span class="add-numero-itens" id="qntd-carrinho-\${id}">\${qntd}</span>
                <span class="btn-mais" onclick="cardapio.metodos.alterarQuantidadeCarrinho('\${id}', 'aumentar')"><i class="fas fa-plus"></i></span>
                <span class="btn btn-remove no-mobile" onclick="cardapio.metodos.removerItemCarrinho('\${id}')"><i class="fa fa-times"></i></span>
            </div>
        </div>
    `,

    itemResumo: `
        <div class="col-12 item-carrinho resumo">
            <div class="img-produto-resumo">
                <img src="\${img}" />
            </div>
            <div class="dados-produto">
                <p class="title-produto-resumo"><b>\${nome}</b></p>
                <p class="price-produto-resumo"><b>R$ \${preco}</b></p>
            </div>
            <p class="quantidade-produto-resumo">x <b>\${qntd}</b></p>
        </div>
    `,
};
