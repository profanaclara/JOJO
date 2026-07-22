window.JOJO_DATA = {
    primaryCards: [
        {
            id: "jogos",
            title: "Jogos",
            description: "Leitura, alfabetização e novos eixos em um só lugar.",
            icon: "./assets/jojo-home-jogos.png",
            buttonLabel: "Abrir jogos",
            href: "./jogos/index.html",
            variant: "reading"
        },
        {
            id: "timer",
            title: "Ferramentas",
            description: "Organize o tempo da sala de forma leve.",
            icon: "./assets/jojo-menu-ferramentas.png",
            buttonLabel: "Usar agora",
            href: "./jogos/timer/index.html",
            variant: "timer"
        }
    ],
    smallCards: [
        {
            id: "agenda",
            title: "Agenda",
            description: "Registro diário por aluno.",
            icon: "./assets/jojo-home-registros.png",
            href: "./agenda/index.html",
            variant: "agenda",
            panelTitle: "Agenda",
            panelDescription: "Organize datas, combinados e atividades planejadas para a turma. Em breve este espaço vira a agenda do professor."
        },
        {
            id: "favoritos",
            title: "Favoritos",
            description: "Atividades marcadas.",
            icon: "./assets/jojo-home-favoritos.png",
            action: "small-info",
            variant: "favorites",
            panelTitle: "Favoritos",
            panelDescription: "Guarde atividades importantes para acessar mais rápido nas próximas versões do JOJO."
        },
        {
            id: "relatorios",
            title: "Relatórios",
            description: "Resultados dos jogos e testes.",
            icon: "./assets/jojo-home-relatorios.png",
            action: "small-info",
            variant: "reports",
            panelTitle: "Relatórios",
            panelDescription: "Aqui o professor vai buscar os resultados dos jogos e testes de leitura para acompanhar o desempenho da turma."
        }
    ],
    readingOptions: [
        {
            title: "Leitura de palavras",
            href: "./jogos/palavras/index.html"
        },
        {
            title: "Leitura de textos",
            href: "./jogos/textos/index.html"
        }
    ],
    toolsOptions: [],
    about: {
        title: "Perfil JOJO",
        description: "JOJO é um app de jogos educacionais criado para apoiar leitura, fluência e organização de rotina em sala de aula.",
        credits: "Desenvolvido por Ana Clara Silva de Lima"
    },
    soon: {
        title: "Em breve",
        description: "Esse espaço já ficou reservado para uma próxima versão do JOJO."
    }
};
