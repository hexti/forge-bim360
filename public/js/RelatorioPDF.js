async function gerarRelatorioPDF (containerId, urn) {
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

    const $jpg = /(jpe?g)$/i

    let html = `<style type="text/css">
        .tg  {border-collapse:collapse;border-spacing:0;}
        .tg td{border-width:1px;font-family:Arial, sans-serif;font-size:10px;
        overflow:hidden;padding:10px 5px;word-break:normal;}
        .tg th{font-family:Arial, sans-serif;font-size:14px;
        font-weight:normal;overflow:hidden;padding:10px 5px;word-break:normal;}
        .tg .tg-73oq{text-align:left;vertical-align:top}
        .tg .tg-74oq{text-align:center;vertical-align:middle}
        .AddBorderBaixo{border-bottom: 1px solid #000;}
        .AddBorderAlto{border-top: 1px solid #000;}
        .AddBorderDireita{border-right: 1px solid #000;}
        .AddBorderEsquerda{border-left: 1px solid #000;}
        .col-img{max-width:100%; max-height: 30vh;}
        </style>`

    try {
        const { data: fileInformation } = await $api.get(`/data/v1/projects/b.${containerId}/items/${urn}`)

        const _issues = await $api.get(`/issues/v1/containers/${containerId}/quality-issues?filter[target_urn]=${urn}`)

        const issues = _issues.data.data

        const _lists = await $api.get(`/issues/v2/containers/${containerId}/issue-attribute-definitions?filter[dataType]=list`)

        const lists = _lists.data.results
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

            html += `<table class="tg" style="table-layout: fixed; width: 100%">
            <colgroup>
                <col style="width: 25px">
                <col style="width: 25px">
                <col style="width: 25px">
                <col style="width: 25px">
                <col style="width: 5px">
                <col style="width: 25px">
                <col style="width: 25px">
                <col style="width: 25px">
                <col style="width: 25px">
            </colgroup>
            <thead>
              <tr>
                <th colspan="2" class="tg-74oq AddBorderEsquerda AddBorderAlto AddBorderBaixo">
                    <img width="90%" src="${location.origin}/img/concremat_port340.png">
                </th>
                <th colspan="7" class="tg-73oq AddBorderDireita AddBorderAlto" style=" text-align:center;">
                    <label style="font-size:18pt;font-weight:900;">Mapeamento de Anomalias</label>
                    <p>${fileInformation.data.attributes.displayName.split(".")[0]}</p>
                    <span>Anomalia Nº ${issue.attributes.identifier}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="9"></td>
              </tr>
              <tr>
                <td class="AddBorderEsquerda AddBorderAlto AddBorderDireita" colspan="4" align="center"><h4>Informações Gerais</h4></td>
                <td></td>
                <td class="AddBorderEsquerda AddBorderAlto AddBorderDireita" colspan="4" align="center"><h4>Detalhes da Anomalia</h4></td>
              </tr>
              <tr>
                <td class="tg-73oq AddBorderEsquerda" colspan="2">Localização:</td>
                <td class="tg-73oq AddBorderDireita" colspan="2">${issue.attributes.location_description || '(sem informações cadastrada)'}</td>
                <td></td>
                <td class="tg-73oq AddBorderEsquerda">Face:</td>
                <td class="tg-73oq">${_face}</td>
                <td class="tg-73oq">Quantidade:</td>
                <td class="AddBorderDireita tg-73oq">${issue.attributes.custom_attributes[2].value || '(sem informações)'}</td>
              </tr>
              <tr>
                <td class="AddBorderEsquerda AddBorderDireita" colspan="4"></td>
                <td></td>
                <td class="AddBorderEsquerda tg-73oq">Causa Provável:</td>
                <td class="tg-73oq">${issue.attributes.custom_attributes[4].value || '(sem informações)'}</td>
                <td class="tg-73oq">Espaçamento:</td>
                <td class="AddBorderDireita tg-73oq">${issue.attributes.custom_attributes[6].value || '(sem informações)'}</td>
              </tr>
              <tr>
                <td class="tg-73oq AddBorderEsquerda AddBorderBaixo">Elemento Estrutural:</td>
                <td class="tg-73oq AddBorderBaixo">${issue.attributes.location_description || '(sem informações)'}</td>
                <td class="tg-73oq AddBorderBaixo">Nível de alerta:</td>
                <td class="tg-73oq AddBorderDireita AddBorderBaixo">${issue.attributes.custom_attributes[7].value || '(sem informações)'}</td>
                <td></td>
                <td class="tg-73oq AddBorderEsquerda">Estado:</td>
                <td class="tg-73oq">${issue.attributes.custom_attributes[0].value || '(sem informações)'}</td>
                <td class="tg-73oq">Abertura:</td>
                <td class="AddBorderDireita tg-73oq">${issue.attributes.custom_attributes[7].value || '(sem informações)'}</td>
              </tr>
              <tr>
                <td colspan="5"></td>
                <td colspan="2" class="tg-73oq AddBorderEsquerda AddBorderBaixo">Dimensão Horizontal:</td>
                <td colspan="2" class="tg-73oq AddBorderDireita AddBorderBaixo"></td>
              </tr>
              <tr>
                <td colspan="9"></td>
              </tr>
              <tr>
                <td class="AddBorderEsquerda AddBorderAlto AddBorderDireita" colspan="4" align="center"><h4>Observações</h4></td>
                <td></td>
                <td class="AddBorderEsquerda AddBorderAlto AddBorderDireita" colspan="4" align="center"><h4>Localização Esquemática da Anomalia </h4></td>
              </tr>
              <tr>
                <td colspan="4" class="AddBorderBaixo AddBorderDireita AddBorderEsquerda">${issue.attributes.description || '(sem informações)'}</td>
                <td class="tg-73oq"></td>
                <td colspan="4" class="AddBorderBaixo AddBorderDireita AddBorderEsquerda" align="center">`

            const viewport = issue.attributes.pushpin_attributes.viewer_state.viewport

            viewer.restoreState({ viewport }, null, true)

            const { clientWidth, clientHeight } = viewer.container

            const promisify = () => new Promise((resolve) => {
                viewer.getScreenShot(clientWidth, clientHeight, resolve)
            })

            const imageUrl = await promisify()
            html += `
                            <img src="${imageUrl}" class="col-img">
                        </td>
                    </tr>
                    <tr>
                        <td colspan="9"></td>
                    </tr>`

            const _attachments = await $api.get(issue.relationships.attachments.links.related)
            const attachments = _attachments.data.data

            const img = []

            for (const attachment of attachments) {
                if ($jpg.test(attachment.attributes.url)) {
                    const { data: image } = await $api.get(attachment.attributes.url, { responseType: 'blob' })
                    const objUrl = URL.createObjectURL(image)

                    img.push({src: objUrl, name: attachment.attributes.name})

                    aguardar()
                }
            }

            if (img.length) {
                html += `<tr>
                            <td colspan="4" class="AddBorderBaixo AddBorderDireita AddBorderEsquerda AddBorderAlto" align="center"><img src="${img[0].src}" class="col-img"><p>${img[0].name}</p></td>
                            <td></td>`
                if (img[1] && img[1].src) {
                    html += `<td colspan="4" class="AddBorderBaixo AddBorderDireita AddBorderEsquerda AddBorderAlto" align="center"><img src="${img[1].src}" class="col-img"><p>${img[0].name}</p></td>
                    </tr>`
                } else {
                    html += `<td colspan="4" class="AddBorderBaixo AddBorderDireita AddBorderEsquerda AddBorderAlto"></td>
                    </tr>`
                }
            }

            html += `</tbody>
                </table>`

            if (count < issues.length) {
                html += '<table style="page-break-before: always;"></table>'
            }
        }

        const fullHtml = `<!DOCTYPE html><html><meta charset="utf-8" /><body>${html}</body></html>`

        const base64 = await toBase64(fullHtml)

        return Promise.resolve([html, base64])
    } catch (e) {
        return Promise.reject(e)
    }
}
