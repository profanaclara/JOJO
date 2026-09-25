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
                            title: "Fluência leitora",
                            description: "Letras, sílabas e palavras.",
                            art: "./assets/jojo-card-palavras.webp",
                            tag: "Alfabetização",
                            href: "./jogos/palavras/"
                        },
                        {
                            title: "Leitura de textos",
                            description: "Textos, palavras e pseudopalavras.",
                            art: "./assets/jojo-card-textos.webp",
                            tag: "Alfabetização",
                            href: "./jogos/textos/"
                        },
                        {
                            title: "Gêneros textuais",
                            description: "Leia, descubra e tente outra vez.",
                            art: "./assets/jojo-card-generos-textuais.webp",
                            tag: "Alfabetização",
                            href: "./jogos/generos-textuais/"
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
                            art: "./assets/jojo-card-popit.webp",
                            href: "./jogos/popit-soma/"
                        },
                        {
                            title: "Pop-it da subtração",
                            description: "Aperte, retire e conte o que sobrou.",
                            art: "./assets/jojo-card-popit.webp",
                            href: "./jogos/popit-subtracao/"
                        },
                        {
                            title: "Tabuada de Pitágoras",
                            description: "Escolha os fatores e encontre o resultado na tabela.",
                            art: "./assets/jojo-card-pitagoras.webp",
                            href: "./jogos/tabuada-pitagoras/"
                        },
                        {
                            title: "Cabo de Guerra",
                            description: "Cabo de guerra com operações e frações.",
                            art: "./assets/jojo-card-cabo-guerra.webp",
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
                            art: "./assets/jojo-card-geometria.webp",
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
                    title: "Agenda",
                    description: "Registre o dia e acompanhe o histórico de cada aluno.",
                    art: "./assets/jojo-home-registros.webp",
                    tag: "Ferramenta",
                    href: "./agenda/"
                },
                {
                    title: "Timer",
                    description: "Organize o tempo da sala de forma leve.",
                    art: "./assets/jojo-card-timer.webp",
                    tag: "Ferramenta",
                    href: "./jogos/timer/"
                }
            ]
        }
    }
};
