self.addEventListener('message', async function ({ data }) {
    try {
        const { token, containerId, urn } = data
        const toBase64 = (data) => new Promise((resolve, reject) => {
            const reader = new FileReader

            reader.addEventListener('loadend', () => {
                resolve(reader.result)
            })

            reader.addEventListener('error', () => {
                reject(reader.error)
            })

            reader.readAsDataURL(new Blob([data]))
        })

        const init = {
            credentials: 'include',
            method: 'get',
            headers: {
                Authorization: `Bearer ${token}`
            }
        }

        const $jpg = /(jpe?g)$/i

        let html = ''

        const _issues = await fetch(`/p/https://developer.api.autodesk.com/issues/v1/containers/${containerId}/quality-issues?filter[target_urn]=${urn}`, init).then(res => res.json())

        const issues = _issues.data

        const _lists = await fetch(`/p/https://developer.api.autodesk.com/issues/v2/containers/${containerId}/issue-attribute-definitions?filter[dataType]=list`, init).then(res => res.json())

        const lists = _lists.results
        let count = 0

        for (const issue of issues) {
            let _face = ''

            count++;

            for (const list of lists) {
                if(issue.attributes.custom_attributes[1].id === list.id) {
                    for (const op of list.metadata.list.options) {
                        if(op.id === issue.attributes.custom_attributes[1].value) {
                            _face = op.value
                        }
                    }
                }
            }

            html += `<table class="tg" style="table-layout: fixed; width: 100%"><thead><tr><th class="tg-0pky" style="text-align:center;vertical-align:middle" colspan="2" rowspan="3"><img src="${location.origin}/img/concremat_port340.png" width="100%"></th><th class="tg-cudy" colspan="6">Mapeamento de Anomalias</th></tr><tr><td class="tg-hq8k" colspan="6">Nome do Projeto</td></tr><tr><td class="tg-c3ow" colspan="6">Anomalia Nº ${issue.attributes.identifier}</td></tr></thead><tbody><tr><td class="tg-0pky" colspan="8"></td></tr><tr><td class="tg-0pky"></td><td class="tg-doeh" colspan="6">Informações Gerais</td><td class="tg-0pky"></td></tr><tr><td class="tg-0pky"></td><td class="tg-l6li">Localização:</td><td class="tg-l6li">${issue.attributes.location_description || '(sem informações)'}</td><td class="tg-l6li" colspan="2">Causa Raiz:</td><td class="tg-l6li" colspan="2">${issue.attributes.root_cause || '(sem informações)'}</td><td class="tg-0pky"></td></tr><tr><td class="tg-0pky"></td><td class="tg-l6li">Elemento Estrutural:</td><td class="tg-l6li">${issue.attributes.location_description || '(sem informações)'}</td><td class="tg-l6li" colspan="2">Nível de Alerta:</td><td class="tg-l6li" colspan="2">${issue.attributes.custom_attributes[7].value || '(sem informações)'}</td><td class="tg-0pky"></td></tr><tr><td class="tg-0pky" colspan="8"></td></tr><tr><td class="tg-0pky"></td><td class="tg-doeh" colspan="6">Detalhes da Anomalia</td><td class="tg-0pky"></td></tr><tr><td class="tg-0pky"></td><td class="tg-l6li">Face:</td><td class="tg-l6li">${_face}</td><td class="tg-l6li" colspan="2">Quantidade:</td><td class="tg-l6li" colspan="2">${issue.attributes.custom_attributes[2].value || '(sem informações)'}</td><td class="tg-0pky"></td></tr><tr><td class="tg-0pky"></td><td class="tg-l6li">Causa Provável:</td><td class="tg-l6li">${issue.attributes.custom_attributes[4].value || '(sem informações)'}</td><td class="tg-l6li" colspan="2">Espaçamento:</td><td class="tg-l6li" colspan="2">${issue.attributes.custom_attributes[6].value || '(sem informações)'}</td><td class="tg-0pky"></td></tr><tr><td class="tg-0pky"></td><td class="tg-l6li">Estado:</td><td class="tg-l6li">${issue.attributes.custom_attributes[0].value || '(sem informações)'}</td><td class="tg-l6li" colspan="2">Abertura:</td><td class="tg-l6li" colspan="2">${issue.attributes.custom_attributes[7].value || '(sem informações)'}</td><td class="tg-0pky"></td></tr><tr><td class="tg-0pky"></td><td class="tg-doeh" colspan="6">Observações</td><td class="tg-0pky"></td></tr><tr><td class="tg-0lax"></td><td class="tg-jpc1" colspan="6">${issue.attributes.description || '(sem informações)'}</td><td class="tg-0lax"></td></tr></tbody></table>`

            const _attachments = await fetch('/p/' + issue.relationships.attachments.links.related, init).then(res => res.json())

            const attachments = _attachments.data

            for (const attachment of attachments) {
                if ($jpg.test(attachment.attributes.url)) {
                    const image = await fetch('/p/' + attachment.attributes.url, init).then(res => res.blob())
                    const objUrl = URL.createObjectURL(image)

                    html += `<table class="tg" style="table-layout: fixed; width: 100%"><tbody><tr><td class="tg-0pky"></td><td class="tg-doeh" colspan="6"><div><img src="${objUrl}" style="max-width: 100%; max-height: 40vh"></div><span>${attachment.attributes.name}</span></td><td class="tg-0pky"></td></tr></tbody></table>`

                    for (let i = 0; i < 3e6; i++) {
                        // Intervalo
                    }
                }
            }

            if(count < issues.length){
                html += '<table style="page-break-before: always;"></table>'
            }
        }

        const style = '<style>.tg {border-collapse:collapse;border-spacing:0;}.tg td{border-color:inherit;border-style:solid;border-width:1px;font-family:Arial, sans-serif;font-size:14px;overflow:hidden;padding:10px 5px;word-break:normal;}.tg th{border-color:inherit;border-style:solid;border-width:1px;font-family:Arial, sans-serif;font-size:14px;font-weight:normal;overflow:hidden;padding:10px 5px;word-break:normal;}.tg .tg-doeh{border-color:inherit;font-size:10px;font-weight:bold;text-align:center;vertical-align:top;}.tg .tg-c3ow{border-color:inherit;text-align:center;vertical-align:top}.tg .tg-hq8k{border-color:inherit;color:#343434;font-size:100%;text-align:center;vertical-align:middle;}.tg .tg-l6li{border-color:inherit;font-size:10px;text-align:left;vertical-align:top;}.tg .tg-0pky{border-color:inherit;text-align:left;vertical-align:top;}.tg .tg-cudy{border-color:inherit;font-family:Arial, Helvetica, sans-serif !important;font-weight:bold;text-align:center;vertical-align:top;}.tg .tg-0lax{border-color:inherit;text-align:left;vertical-align:top;}.tg .tg-jpc1{border-color:inherit;font-size:10px;text-align:left;vertical-align:top;}</style>'

        const fullHtml = `<!DOCTYPE html><html><meta charset="utf-8" /><body>${html}</body></html>`

        const base64 = await toBase64(fullHtml)

        self.postMessage([style + html, base64])
    } catch (e) {
        self.postMessage({ error: e })
    }
})
