window.JOJO_TIMER_DATA = {
    modes: {
        lanche: {
            id: "lanche",
            eyebrow: "",
            title: "LANCHE",
            subtitle: "",
            cardDescription: "",
            accentClass: "is-lanche",
            emoji: "lanche",
            destinationAssets: [
                { src: "./assets/legumes.webp", label: "Legumes" },
                { src: "./assets/frutas.webp", label: "Frutas" },
                { src: "./assets/pizza.webp", label: "Pizza" },
                { src: "./assets/hamburguer.webp", label: "Hambúrguer" },
                { src: "./assets/tacos.webp", label: "Tacos" },
                { src: "./assets/carnes.webp", label: "Carnes" }
            ],
            progressTitle: "",
            progressMessages: [
                "",
                "",
                "",
                "",
                ""
            ],
            finishTitle: "HORA DO LANCHINHO!",
            finishText: "O TEMPO ACABOU. AGORA É HORA DO LANCHINHO.",
            finishEmoji: "",
            finishBadge: "PRONTO PARA O LANCHE",
            finishAssets: [
                { src: "./assets/coracao-com-fome.webp", label: "Coração com fome" }
            ]
        },
        casa: {
            id: "casa",
            eyebrow: "",
            title: "CASA",
            subtitle: "",
            cardDescription: "",
            accentClass: "is-casa",
            emoji: "casa",
            destinationLabel: "CHEGADA EM CASA",
            destinationAsset: "./assets/casa.webp",
            progressTitle: "",
            progressMessages: [
                "",
                "",
                "",
                "",
                ""
            ],
            finishTitle: "HORA DE IR PARA CASA!",
            finishText: "O TEMPO ACABOU. AGORA É HORA DE IR EMBORA.",
            finishEmoji: "",
            finishBadge: "PRONTO PARA A SAÍDA",
            finishAssets: [
                { src: "./assets/coracao-feliz.webp", label: "Coração feliz" },
                { src: "./assets/casa.webp", label: "Casa" }
            ]
        },
        livre: {
            id: "livre",
            eyebrow: "",
            title: "CRONÔMETRO",
            subtitle: "Defina o tempo e acompanhe a contagem pela ampulheta.",
            cardDescription: "",
            accentClass: "is-livre",
            emoji: "livre",
            progressTitle: "Ampulheta em movimento",
            progressMessages: [
                "A ampulheta acabou de começar.",
                "A areia está descendo.",
                "A contagem segue pela ampulheta.",
                "Falta pouco para terminar.",
                "Últimos instantes!"
            ],
            finishTitle: "TEMPO FINALIZADO!",
            finishText: "A AMPULHETA TERMINOU A CONTAGEM.",
            finishEmoji: "⌛",
            finishBadge: "CRONÔMETRO CONCLUÍDO",
            finishAssets: []
        }
    },
    about: {
        title: "Como funciona",
        paragraphs: [
            "Este timer foi pensado para tornar a espera mais previsível para crianças que precisam de apoio visual e numérico.",
            "A criança acompanha o tempo em números grandes e também vê o estudante avançando até o destino escolhido."
        ],
        bullets: [
            "Escolha o tipo de timer e digite o tempo em horas e minutos.",
            "A trilha visual mostra claramente quanto já passou e quanto ainda falta.",
            "Os botões de pausar, continuar e recomeçar ajudam a adaptar o uso à rotina."
        ],
        footer: "Idealizado por Ana Clara Silva de Lima"
    }
};
