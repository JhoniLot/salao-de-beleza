const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. Modals de Edição
const editModals = `
    <!-- Modal Editar Cliente -->
    <div id="editar-cliente" class="modal-content" style="display: none;">
        <div class="modal-header">
            <h2>Editar Cliente</h2>
            <button class="btn btn-ghost" onclick="closeModal()"><i data-lucide="x"></i></button>
        </div>
        <div class="form-group">
            <label>Nome Completo</label>
            <input type="text" id="edit-cli-nome" class="form-control">
            <input type="hidden" id="edit-cli-id">
        </div>
        <div class="form-group">
            <label>WhatsApp</label>
            <input type="text" id="edit-cli-whats" class="form-control">
        </div>
        <button class="btn btn-primary" style="width: 100%; margin-top: 12px;" onclick="salvarEdicaoCliente()">Salvar Alterações</button>
    </div>

    <!-- Modal Editar Serviço -->
    <div id="editar-servico" class="modal-content" style="display: none;">
        <div class="modal-header">
            <h2>Editar Serviço</h2>
            <button class="btn btn-ghost" onclick="closeModal()"><i data-lucide="x"></i></button>
        </div>
        <div class="form-group">
            <label>Nome do Serviço</label>
            <input type="text" id="edit-srv-nome" class="form-control">
            <input type="hidden" id="edit-srv-id">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
                <label>Preço (R$)</label>
                <input type="number" id="edit-srv-preco" class="form-control">
            </div>
            <div class="form-group">
                <label>Duração (min)</label>
                <input type="number" id="edit-srv-duracao" class="form-control">
            </div>
        </div>
        <div class="form-group" style="display: flex; align-items: center; gap: 8px; margin-top: 10px;">
            <input type="checkbox" id="edit-srv-encaixe" style="width: 18px; height: 18px;">
            <label for="edit-srv-encaixe" style="margin: 0; font-weight: normal;">Permitir Encaixe neste serviço?</label>
        </div>
        <button class="btn btn-primary" style="width: 100%; margin-top: 12px;" onclick="salvarEdicaoServico()">Salvar Alterações</button>
    </div>
`;
html = html.replace('<!-- Overlay principal para Modais -->', editModals + '\\n    <!-- Overlay principal para Modais -->');

// 2. Lógica de Edição de Cliente
const logicCliente = \`
        async function excluirCliente(id) {
            if (!confirm('Tem certeza que deseja excluir este cliente? Isso apagará também todo o histórico dele.')) return;
            state.clientes = state.clientes.filter(c => c.id !== id);
            // Também apagar agendamentos dele (simulação de cascade local)
            state.agendamentos = state.agendamentos.filter(a => a.clienteId !== id);
            await dbDelete('clientes', id);
            closeModal();
            showView('clientes');
            toast('Cliente excluído!');
        }

        function abrirEdicaoCliente(id) {
            const c = state.clientes.find(cli => cli.id === id);
            if(!c) return;
            document.getElementById('edit-cli-id').value = c.id;
            document.getElementById('edit-cli-nome').value = c.nome;
            document.getElementById('edit-cli-whats').value = c.whatsapp || '';
            openModal('editar-cliente');
        }

        async function salvarEdicaoCliente() {
            const id = document.getElementById('edit-cli-id').value;
            const nome = document.getElementById('edit-cli-nome').value;
            const whats = document.getElementById('edit-cli-whats').value;
            const c = state.clientes.find(cli => cli.id === id);
            if(c) {
                c.nome = nome;
                c.whatsapp = whats;
                await dbUpdate('clientes', id, { nome: nome, telefone: whats });
                closeModal();
                showView('clientes');
                toast('Cliente atualizado!');
                if (document.getElementById('perfil-cliente').style.display !== 'none') {
                    // Update current profile modal if it's open
                    openModal('perfil-cliente', id);
                }
            }
        }
\`;

// 3. Lógica de Edição de Serviço
const logicServico = \`
        function abrirEdicaoServico(id) {
            const s = state.servicos.find(ser => ser.id === id);
            if(!s) return;
            document.getElementById('edit-srv-id').value = s.id;
            document.getElementById('edit-srv-nome').value = s.nome;
            document.getElementById('edit-srv-preco').value = s.preco;
            document.getElementById('edit-srv-duracao').value = s.duracao;
            document.getElementById('edit-srv-encaixe').checked = s.permiteEncaixe === true;
            openModal('editar-servico');
        }

        async function salvarEdicaoServico() {
            const id = document.getElementById('edit-srv-id').value;
            const nome = document.getElementById('edit-srv-nome').value;
            const preco = parseFloat(document.getElementById('edit-srv-preco').value);
            const duracao = parseInt(document.getElementById('edit-srv-duracao').value);
            const encaixe = document.getElementById('edit-srv-encaixe').checked;
            const s = state.servicos.find(ser => ser.id === id);
            if(s) {
                s.nome = nome;
                s.preco = preco;
                s.duracao = duracao;
                s.permiteEncaixe = encaixe;
                await dbUpdate('servicos', id, { nome, preco, duracao, permite_encaixe: encaixe });
                closeModal();
                showView('servicos');
                toast('Serviço atualizado!');
            }
        }
\`;

html = html.replace('// --- SERVICOS ---', logicCliente + '\\n\\n' + logicServico + '\\n\\n        // --- SERVICOS ---');

// 4. Injetar botões na UI
// Botão de editar e excluir no perfil do cliente
html = html.replace(
    /<div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">/g, 
    '<div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px; position: relative;">\\n' + 
    '<div style="position: absolute; top: 0; right: 0; display: flex; gap: 8px;">\\n' +
    '<button class="btn btn-ghost" onclick="abrirEdicaoCliente(\\'${c.id}\\')" style="padding: 6px;"><i data-lucide="edit"></i></button>\\n' +
    '<button class="btn btn-ghost" onclick="excluirCliente(\\'${c.id}\\')" style="padding: 6px; color: var(--danger);"><i data-lucide="trash-2"></i></button>\\n' +
    '</div>'
);

// Botão de editar serviço
html = html.replace(
    /<button class="btn btn-ghost" onclick="excluirServico\\('\\$\\{s\\.id\\}'\\)" style="color: var\\(--danger\\)">/g,
    '<button class="btn btn-ghost" onclick="abrirEdicaoServico(\\'${s.id}\\')"><i data-lucide="edit"></i></button>\\n' +
    '<button class="btn btn-ghost" onclick="excluirServico(\\'${s.id}\\')" style="color: var(--danger)">'
);

fs.writeFileSync('index.html', html, 'utf8');
console.log('CRUD Patch Done!');
