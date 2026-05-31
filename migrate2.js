const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const replacements = [
    {
        find: /function excluirAgendamento\(id\) \{/g,
        replace: 'async function excluirAgendamento(id) {'
    },
    {
        find: /state\.agendamentos = state\.agendamentos\.filter\(a => a\.id !== id\);\s*save\(\);/g,
        replace: 'state.agendamentos = state.agendamentos.filter(a => a.id !== id); save(); await dbDelete("agendamentos", id);'
    },
    {
        find: /function marcarComoRealizado\(id\) \{/g,
        replace: 'async function marcarComoRealizado(id) {'
    },
    {
        find: /c\.pontos = \(c\.pontos \|\| 0\) \+ s\.pontos;/g,
        replace: 'c.pontos = (c.pontos || 0) + s.pontos; await dbUpdate("clientes", c.id, { pontos_fidelidade: c.pontos });'
    },
    {
        find: /c\.totalVisitas\+\+;/g,
        replace: 'c.totalVisitas++; await dbUpdate("clientes", c.id, { ultimaVisita: c.ultimaVisita, totalVisitas: c.totalVisitas });'
    },
    {
        find: /a\.status = 'realizado';/g,
        replace: 'a.status = "realizado"; await dbUpdate("agendamentos", a.id, { status: "realizado" });'
    },
    {
        find: /state\.transacoes\.push\(\{([\s\S]*?)\}\);/g,
        replace: 'const novaTransacao = {$1}; state.transacoes.push(novaTransacao); await dbInsert("transacoes", novaTransacao);'
    },
    {
        find: /function reporEstoque\(id\) \{/g,
        replace: 'async function reporEstoque(id) {'
    },
    {
        find: /p\.qtd\+\+;/g,
        replace: 'p.qtd++; await dbUpdate("estoque", p.id, { qtd: p.qtd });'
    }
];

replacements.forEach(r => {
    html = html.replace(r.find, r.replace);
});

fs.writeFileSync('index.html', html, 'utf8');
console.log('Patch 2 concluído!');
