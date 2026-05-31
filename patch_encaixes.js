const fs = require('fs');

const b64Helper = Buffer.from(
\`// --- Helper de Encaixes ---
function toggleListaEncaixes(checkboxId, containerId) {
    const isChecked = document.getElementById(checkboxId).checked;
    const container = document.getElementById(containerId);
    container.style.display = isChecked ? 'block' : 'none';
}

function renderCheckboxEncaixes(containerId, serviceIdToExclude = null, preSelecionados = []) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let html = '<div style="margin-top:8px; padding: 12px; background: var(--bg-color); border-radius: 8px; border: 1px solid var(--border-color);">';
    html += '<label style="font-size:12px; margin-bottom:8px; display:block;">Selecione os serviços que podem ser feitos simultaneamente:</label>';
    html += '<div style="display: flex; flex-direction: column; gap: 8px; max-height: 150px; overflow-y: auto; padding-right: 4px;">';
    
    let hasOptions = false;
    state.servicos.forEach(s => {
        if (s.id !== serviceIdToExclude) {
            hasOptions = true;
            const isChecked = preSelecionados.includes(s.id) ? 'checked' : '';
            html += \`
                <label style="display: flex; align-items: center; gap: 8px; font-weight: normal; cursor: pointer; margin:0;">
                    <input type="checkbox" class="\${containerId}-chk" value="\${s.id}" \${isChecked} style="width: 16px; height: 16px;">
                    <span style="font-size: 13px;">\${s.nome} (\${s.duracao} min)</span>
                </label>
            \`;
        }
    });
    
    if (!hasOptions) {
        html += '<span style="font-size:12px; color:var(--text-light);">Não há outros serviços cadastrados.</span>';
    }
    
    html += '</div></div>';
    container.innerHTML = html;
}
\`, 'utf8').toString('base64');

const b64NovoServicoHtml = Buffer.from(\`
                    <div class="form-group" style="margin-top: 10px; display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="new-srv-encaixe" onchange="toggleListaEncaixes('new-srv-encaixe', 'lista-encaixes-novo')" style="width: 16px; height: 16px; accent-color: var(--primary);">
                        <label for="new-srv-encaixe" style="margin: 0; font-size: 14px; cursor: pointer;">Permitir Encaixe neste serviço?</label>
                    </div>
                    <div id="lista-encaixes-novo" style="display:none; margin-bottom: 12px;"></div>
\`, 'utf8').toString('base64');

const b64EditarServicoHtml = Buffer.from(\`
        <div class="form-group" style="display: flex; align-items: center; gap: 8px; margin-top: 10px;">
            <input type="checkbox" id="edit-srv-encaixe" onchange="toggleListaEncaixes('edit-srv-encaixe', 'lista-encaixes-edit')" style="width: 18px; height: 18px;">
            <label for="edit-srv-encaixe" style="margin: 0; font-weight: normal;">Permitir Encaixe neste serviço?</label>
        </div>
        <div id="lista-encaixes-edit" style="display:none; margin-bottom: 12px;"></div>
\`, 'utf8').toString('base64');


let html = fs.readFileSync('index.html', 'utf8');

// 1. Injetar Helper
html = html.replace('// --- SERVICOS ---', Buffer.from(b64Helper, 'base64').toString('utf8') + '\\n\\n// --- SERVICOS ---');

// 2. Modificar openModal('novo-servico') para chamar renderCheckboxEncaixes
html = html.replace(
    /content\.innerHTML = `[\\s\\S]*?id="new-srv-encaixe"[\\s\\S]*?Salvar Serviço<\/button>[\\s\\S]*?`;/,
    (match) => {
        let newMatch = match.replace(
            /<div class="form-group" style="margin-top: 10px; display: flex; align-items: center; gap: 8px;">[\\s\\S]*?Permitir Encaixe neste serviço\?<\/label>\\s*<\/div>/,
            Buffer.from(b64NovoServicoHtml, 'base64').toString('utf8')
        );
        newMatch += "\\n                setTimeout(() => renderCheckboxEncaixes('lista-encaixes-novo', null, []), 50);";
        return newMatch;
    }
);

// 3. Modificar HTML de editar-servico
html = html.replace(
    /<div class="form-group" style="display: flex; align-items: center; gap: 8px; margin-top: 10px;">\\s*<input type="checkbox" id="edit-srv-encaixe" style="width: 18px; height: 18px;">\\s*<label for="edit-srv-encaixe" style="margin: 0; font-weight: normal;">Permitir Encaixe neste serviço\?<\/label>\\s*<\/div>/,
    Buffer.from(b64EditarServicoHtml, 'base64').toString('utf8')
);

// 4. Modificar abrirEdicaoServico
html = html.replace(
    /document\.getElementById\('edit-srv-encaixe'\)\.checked = s\.permiteEncaixe === true;\\s*openModal\('editar-servico'\);/,
    \`document.getElementById('edit-srv-encaixe').checked = s.permiteEncaixe === true;
            openModal('editar-servico');
            renderCheckboxEncaixes('lista-encaixes-edit', s.id, s.servicos_compativeis || []);
            toggleListaEncaixes('edit-srv-encaixe', 'lista-encaixes-edit');\`
);

// 5. Modificar saveNovoServico
html = html.replace(
    /const permiteEncaixe = document\.getElementById\('new-srv-encaixe'\)\.checked;/,
    \`const permiteEncaixe = document.getElementById('new-srv-encaixe').checked;
            const compativeis = [];
            if (permiteEncaixe) {
                document.querySelectorAll('.lista-encaixes-novo-chk:checked').forEach(cb => compativeis.push(cb.value));
            }\`
);
html = html.replace(
    /permiteEncaixe: permiteEncaixe\\s*\};/,
    \`permiteEncaixe: permiteEncaixe,
                servicos_compativeis: compativeis
            };\n\`
);
html = html.replace(
    /await dbInsert\('servicos', novo\);/,
    \`await dbInsert('servicos', { ...novo, servicos_compativeis: compativeis });\`
);

// 6. Modificar salvarEdicaoServico
html = html.replace(
    /const encaixe = document\.getElementById\('edit-srv-encaixe'\)\.checked;/,
    \`const encaixe = document.getElementById('edit-srv-encaixe').checked;
            const compativeis = [];
            if (encaixe) {
                document.querySelectorAll('.lista-encaixes-edit-chk:checked').forEach(cb => compativeis.push(cb.value));
            }\`
);
html = html.replace(
    /s\.permiteEncaixe = encaixe;/,
    \`s.permiteEncaixe = encaixe;
                s.servicos_compativeis = compativeis;\`
);
html = html.replace(
    /await dbUpdate\('servicos', id, \{ nome, preco, duracao, permite_encaixe: encaixe \}\);/,
    \`await dbUpdate('servicos', id, { nome, preco, duracao, permite_encaixe: encaixe, servicos_compativeis: compativeis });\`
);

fs.writeFileSync('index.html', html, 'utf8');
console.log('Advanced Double Booking Patch Applied!');
