window.JOJO_DATA = {
    sections: {
        games: {
            eyebrow: "Jogos",
            title: "Jogos",
            type: "tabs",
            tabs: [
                {
                    id: "language",
                    label: "Leitura",
                    items: [
                        {
                            title: "Leitura de palavras",
                            description: "Teste de fluência com palavras isoladas.",
                            art: "./assets/jojo-card-palavras.png",
                            tag: "Alfabetização",
                            href: "./jogos/palavras/"
                        },
                        {
                            title: "Leitura de textos",
                            description: "Textos, palavras e pseudopalavras.",
                            art: "./assets/jojo-card-textos.png",
                            tag: "Alfabetização",
                            href: "./jogos/textos/"
                        }
                    ]
                },
                {
                    id: "math",
                    label: "Matemática",
                    items: [
                        {
                            title: "Pop-it da soma",
                            description: "Aperte, junte e conte as bolinhas.",
                            art: "./assets/jojo-card-popit.png",
                            tag: "Novo",
                            href: "./jogos/popit-soma/"
                        },
                        {
                            title: "Pop-it da subtração",
                            description: "Aperte, retire e conte o que sobrou.",
                            art: "./assets/jojo-card-popit.png",
                            tag: "Novo",
                            href: "./jogos/popit-subtracao/"
                        },
                        {
                            title: "Tabuada de Pitágoras",
                            description: "Escolha os fatores e encontre o resultado na tabela.",
                            art: "./assets/jojo-card-pitagoras.png",
                            tag: "Novo",
                            href: "./jogos/tabuada-pitagoras/"
                        },
                        {
                            title: "Cabo de Guerra",
                            description: "Cabo de guerra com operações e frações.",
                            art: "./assets/jojo-card-cabo-guerra.png",
                            tag: "Clássico",
                            href: "./jogos/cabo-de-guerra-operacoes-fracoes/"
                        }
                    ]
                },
                {
                    id: "geometry",
                    label: "Geometria",
                    items: [
                        {
                            title: "Formas geométricas",
                            description: "Reconhecimento de figuras e padrões. Em breve.",
                            art: "./assets/jojo-card-geometria.png",
                            tag: "Em breve",
                            placeholder: true
                        }
                    ]
                }
            ]
        },
        tools: {
            eyebrow: "Ferramentas de apoio",
            title: "Ferramentas",
            type: "list",
            items: [
                {
                    title: "Timer",
                    description: "Organize o tempo da sala de forma leve.",
                    art: "./assets/jojo-card-timer.png",
                    tag: "Ferramenta",
                    href: "./jogos/timer/"
                }
            ]
        }
    }
};
