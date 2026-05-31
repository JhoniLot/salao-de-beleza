const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Injetar Supabase SDK e Init
const headTagIndex = html.indexOf('<style>');
const supabaseInit = `
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script>
        const supabaseUrl = 'https://nnryehmxitcjsdgaohyb.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ucnllaG14aXRjanNkZ2FvaHliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMzExNjYsImV4cCI6MjA5NTgwNzE2Nn0.rimlx5UkKEM_HXBsmxxNFeYV_aGU2cr42en6-18_Gcg';
        const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        
        async function dbInsert(table, data) {
            try { await supabase.from(table).insert([data]); } catch(e) { console.error(e); }
        }
        async function dbDelete(table, id) {
            try { await supabase.from(table).delete().eq('id', id); } catch(e) { console.error(e); }
        }
        async function dbUpdate(table, id, data) {
            try { await supabase.from(table).update(data).eq('id', id); } catch(e) { console.error(e); }
        }
    </script>
`;
if (!html.includes('supabase.createClient')) {
    html = html.slice(0, headTagIndex) + supabaseInit + html.slice(headTagIndex);
}

// 2. Reescrever initData
const initDataRegex = /function initData\(\) \{[\s\S]*?\/\/\s*---\s*save\s*---/i;
const newInitData = `
        async function initData() {
            state.session = { loggedIn: true, currentEmail: 'admin@salao.com', isDemo: false };
            
            try {
                const [resCli, resSrv, resAge, resTra, resEst, resCfg] = await Promise.all([
                    supabase.from('clientes').select('*'),
                    supabase.from('servicos').select('*'),
                    supabase.from('agendamentos').select('*'),
                    supabase.from('transacoes').select('*'),
                    supabase.from('estoque').select('*'),
                    supabase.from('config').select('*').limit(1).single()
                ]);
                if (resCli.data) state.clientes = resCli.data;
                if (resSrv.data) state.servicos = resSrv.data;
                if (resAge.data) state.agendamentos = resAge.data;
                if (resTra.data) state.transacoes = resTra.data;
                if (resEst.data) state.produtos = resEst.data;
                if (resCfg.data) state.config = { ...state.config, ...resCfg.data };
            } catch (e) {
                console.error('Supabase load error', e);
            }

            if (document.getElementById('auth-wall')) document.getElementById('auth-wall').style.display = 'none';
            if (document.getElementById('billing-gate')) document.getElementById('billing-gate').style.display = 'none';
            document.getElementById('app').style.display = 'flex';
            if (document.getElementById('demo-banner-wrapper')) document.getElementById('demo-banner-wrapper').style.display = 'none';
            document.body.classList.remove('has-demo-banner');
        }

        // --- SAVE ---`;

html = html.replace(/function initData\(\) \{[\s\S]*?\/\/\s*---\s*save\s*---/g, newInitData.trim());
html = html.replace(/window\.onload = \(\) => \{/g, 'window.onload = async () => {');
html = html.replace(/initData\(\);/g, 'await initData();');


// 3. Funções assíncronas
const replacements = [
    {
        find: /function saveNovoCliente\(\) \{/g,
        replace: 'async function saveNovoCliente() {'
    },
    {
        find: /state\.clientes\.push\(novo\);\s*save\(\);/g,
        replace: 'state.clientes.push(novo); save(); await dbInsert("clientes", novo);'
    },
    {
        find: /function saveNovoServico\(\) \{/g,
        replace: 'async function saveNovoServico() {'
    },
    {
        find: /state\.servicos\.push\(novo\);\s*save\(\);/g,
        replace: 'state.servicos.push(novo); save(); await dbInsert("servicos", novo);'
    },
    {
        find: /function excluirServico\(id\) \{/g,
        replace: 'async function excluirServico(id) {'
    },
    {
        find: /state\.servicos = state\.servicos\.filter\(s => s\.id !== id\);\s*save\(\);/g,
        replace: 'state.servicos = state.servicos.filter(s => s.id !== id); save(); await dbDelete("servicos", id);'
    },
    {
        find: /function saveNovoAgendamento\(\) \{/g,
        replace: 'async function saveNovoAgendamento() {'
    },
    {
        find: /state\.agendamentos\.push\(novo\);\s*save\(\);/g,
        replace: 'state.agendamentos.push(novo); save(); await dbInsert("agendamentos", novo);'
    },
    {
        find: /function atualizarStatus\(id, novoStatus\) \{/g,
        replace: 'async function atualizarStatus(id, novoStatus) {'
    },
    {
        find: /ag\.status = novoStatus;\s*save\(\);/g,
        replace: 'ag.status = novoStatus; save(); await dbUpdate("agendamentos", id, { status: novoStatus });'
    },
    {
        find: /function confirmPublicBooking\(\) \{/g,
        replace: 'async function confirmPublicBooking() {'
    },
    {
        find: /state\.clientes\.push\(c\);/g,
        replace: 'state.clientes.push(c); await dbInsert("clientes", c);'
    },
    {
        find: /function saveNovaTransacao\(\) \{/g,
        replace: 'async function saveNovaTransacao() {'
    },
    {
        find: /state\.transacoes\.push\(nova\);\s*save\(\);/g,
        replace: 'state.transacoes.push(nova); save(); await dbInsert("transacoes", nova);'
    },
    {
        find: /function excluirTransacao\(id\) \{/g,
        replace: 'async function excluirTransacao(id) {'
    },
    {
        find: /state\.transacoes = state\.transacoes\.filter\(t => t\.id !== id\);\s*save\(\);/g,
        replace: 'state.transacoes = state.transacoes.filter(t => t.id !== id); save(); await dbDelete("transacoes", id);'
    },
    {
        find: /function saveNovoProduto\(\) \{/g,
        replace: 'async function saveNovoProduto() {'
    },
    {
        find: /state\.produtos\.push\(novo\);\s*save\(\);/g,
        replace: 'state.produtos.push(novo); save(); await dbInsert("estoque", novo);'
    },
    {
        find: /function movimentarEstoque\(id, operacao\) \{/g,
        replace: 'async function movimentarEstoque(id, operacao) {'
    },
    {
        find: /if \(operacao === 'entrada'\) p\.qtd\+\+;\s*else if \(operacao === 'saida' && p\.qtd > 0\) p\.qtd--;\s*save\(\);/g,
        replace: "if (operacao === 'entrada') p.qtd++; else if (operacao === 'saida' && p.qtd > 0) p.qtd--; save(); await dbUpdate('estoque', id, { qtd: p.qtd });"
    }
];

replacements.forEach(r => {
    html = html.replace(r.find, r.replace);
});

fs.writeFileSync('index.html', html, 'utf8');
console.log('Migração Supabase concluída no index.html!');
