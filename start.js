require('dotenv').config()

const path = require('path');
const express = require('express');
const cookieSession = require('cookie-session');
const axios = require('axios');
const bodyParser = require('body-parser')
const qs = require('qs')
const fs = require('fs');

const PORT = process.env.PORT || 3000;
const config = require('./config');

if (config.credentials.client_id == null || config.credentials.client_secret == null) {
    throw new TypeError('Missing FORGE_CLIENT_ID or FORGE_CLIENT_SECRET env. variables.')
}

const app = express();

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieSession({
    name: 'forge_session',
    keys: ['forge_secure_key'],
    maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days, same as refresh token
}));
app.use(express.json({ limit: '50mb' }));
app.use('/api/forge', require('./routes/oauth'));
app.use('/api/forge', require('./routes/datamanagement'));
app.use('/api/forge', require('./routes/user'));

app.use((_, res, next) => {
    res.header('Access-Control-Allow-Credentials', true)
    next()
})

// Redireciona solicitação, CORS
app.get('/p/*', async (req, res) => {
    try {
        const Authorization = req.headers.authorization || ''
        const Cookie = req.headers.cookie || ''
        const url = req.params[0]
        const query = qs.stringify(req.query)
        const $jpg = /(jpe?g)$/i
        const init = {
            headers: { Authorization, Cookie },
            withCredentials: true
        }

        if ($jpg.test(url)) {
            const i = Object.assign(init, { responseType: 'arraybuffer' })
            const ext = /(jpeg)$/i.test(url) ? 'jpeg' : 'jpg'
            const result = await axios.get(url + '?' + query, i)
            const time = (new Date).getTime().toString()
            const file = `${time}.${ext}`

            fs.writeFileSync(`./tmp/${file}`, result.data)

            setTimeout(() => {
                fs.unlink(`./tmp/${file}`, (err) => {
                    if (err) {
                        console.error('Erro ao tentar remover o arquivo: ' + file)
                    }
                })
            }, 1 * 6e4)

            return res.sendFile(`${__dirname}/tmp/${file}`)
        }

        const result = await axios.get(url + '?' + query, init)

        res.send(result.data)
    } catch (e) {
        if (e.response) {
            return res.status(e.response.status).send(e.response.data)
        }

        console.error(e)
        res.sendStatus(500)
    }
})

app.get('/export/xls', async (req, res) => {
    let token = req.query.token
    let containerId = req.query.container
    let urn = req.query.urn
    let _res = res
    const dataset = []
    const excel = require('node-excel-export');
    
    const result =  await axios.get(`https://developer.api.autodesk.com/issues/v1/containers/${containerId}/quality-issues?filter[target_urn]=${urn}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    const issues = result.data.data

    const opt =  await axios.get(`https://developer.api.autodesk.com/issues/v2/containers/${containerId}/issue-attribute-definitions?filter[dataType]=list`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    const lists = opt.data.results
    const styles = {
        headerDark: {
            fill: {
            fgColor: {
                rgb: 'FFFFFF'
            }
            },
            font: {
            color: {
                rgb: '000000'
            },
            sz: 14,
            bold: true,
            underline: true
            }
        },
        cellPink: {
            fill: {
            fgColor: {
                rgb: 'FFFFCCFF'
            }
            }
        },
        cellGreen: {
            fill: {
            fgColor: {
                rgb: 'FF00FF00'
            }
            }
        },
        cellNone: {
            fill: {
            fgColor: {
                rgb: '000000'
            }
            }
        }
        };

        //Array of objects representing heading rows (very top)
        const heading = [
        [{value: 'a1', style: styles.headerDark}, {value: 'b1', style: styles.headerDark}, {value: 'c1', style: styles.headerDark}],
        ['a2', 'b2', 'c2'] // <-- It can be only values
        ];

        //Here you specify the export structure
        const specification = {
        issue_id: { // <- the key should match the actual data key
            displayName: 'Nº Seq.', // <- Here you specify the column header
            headerStyle: styles.headerDark, // <- Header style
            // cellStyle: function(value, row) { // <- style renderer function
            // // if the status is 1 then color in green else color in red
            // // Notice how we use another cell value to style the current one
            // return (row.status_id == 1) ? styles.cellGreen : {fill: {fgColor: {rgb: 'FFFF0000'}}}; // <- Inline cell style is possible
            // },
            width: 60 // <- width in pixels
        },
        localizacao: {
            displayName: 'Localização',
            headerStyle: styles.headerDark,
            // cellFormat: function(value, row) { // <- Renderer function, you can access also any row.property
            // return (value == 1) ? 'Active' : 'Inactive';
            // },
            width: 100 // <- width in chars (when the number is passed as string)
        },
        elemento_estrutural: {
            displayName: 'Elemento Estrutural',
            headerStyle: styles.headerDark,
            //cellStyle: styles.cellPink, // <- Cell style
            width: 220 // <- width in pixels
        },
        root_cause: {
            displayName: 'Sigla',
            headerStyle: styles.headerDark,
            //cellStyle: styles.cellPink, // <- Cell style
            width: 220 // <- width in pixels
        },
        face: {
            displayName: 'Face',
            headerStyle: styles.headerDark,
            //cellStyle: styles.cellPink, // <- Cell style
            width: 220 // <- width in pixels
        },
        causa_provavel: {
            displayName: 'Causa Provável',
            headerStyle: styles.headerDark,
            //cellStyle: styles.cellPink, // <- Cell style
            width: 220 // <- width in pixels
        },
        estado: {
            displayName: 'Estado',
            headerStyle: styles.headerDark,
            //cellStyle: styles.cellPink, // <- Cell style
            width: 220 // <- width in pixels
        },
        dimensao_horizontal: {
            displayName: 'Dimensão horizontal (m)/ Comprimento (m)',
            headerStyle: styles.headerDark,
            //cellStyle: styles.cellPink, // <- Cell style
            width: 220 // <- width in pixels
        },
        dimensao_vertical: {
            displayName: 'Dimensão vertical (m)',
            headerStyle: styles.headerDark,
            //cellStyle: styles.cellPink, // <- Cell style
            width: 220 // <- width in pixels
        },
        quantidade: {
            displayName: 'Quantidade (un.)',
            headerStyle: styles.headerDark,
            //cellStyle: styles.cellPink, // <- Cell style
            width: 220 // <- width in pixels
        },
        espacamento: {
            displayName: 'Espaçamento médio',
            headerStyle: styles.headerDark,
            //cellStyle: styles.cellPink, // <- Cell style
            width: 220 // <- width in pixels
        },
        abertura: {
            displayName: 'Abertura máxima (mm)',
            headerStyle: styles.headerDark,
            //cellStyle: styles.cellPink, // <- Cell style
            width: 220 // <- width in pixels
        },
        nivel_alerta: {
            displayName: 'Nível de Alerta',
            headerStyle: styles.headerDark,
            //cellStyle: styles.cellPink, // <- Cell style
            width: 220 // <- width in pixels
        },
        description: {
            displayName: 'Descrição',
            headerStyle: styles.headerDark,
            //cellStyle: styles.cellPink, // <- Cell style
            width: 220 // <- width in pixels
        },

    }

    let dimensaoVertical = ''
    let _face = ''

    issues.forEach(issue => {
        lists.forEach(list => {
            if(issue.attributes.custom_attributes[1].id == list.id){
                list.metadata.list.options.forEach(option => {
                    if(option.id === issue.attributes.custom_attributes[1].value){
                        _face = option.value
                    }
                });
            }

            if(issue.attributes.custom_attributes[5].id == list.id){
                list.metadata.list.options.forEach(option => {
                    if(option.id === issue.attributes.custom_attributes[1].value){
                        dimensaoVertical = option.value
                    }
                });
            }
        })

        dataset.push({
            issue_id: issue.attributes.identifier,
            localizacao: issue.attributes.location_description,
            elemento_estrutural: issue.attributes.location_description,
            root_cause: issue.attributes.root_cause,
            face: _face,
            causa_provavel: issue.attributes.custom_attributes[4].value,
            estado: issue.attributes.custom_attributes[0].value,
            dimensao_horizontal: issue.attributes.custom_attributes[8].value,
            dimensao_vertical: dimensaoVertical,
            quantidade: issue.attributes.custom_attributes[2].value,
            espacamento: issue.attributes.custom_attributes[6].value,
            abertura: issue.attributes.custom_attributes[7].value,
            nivel_alerta: issue.attributes.custom_attributes[7].value,
            description: issue.attributes.description,
        })
    });

    const merges = [
        { start: { row: 1, column: 1 }, end: { row: 1, column: 10 } },
        { start: { row: 2, column: 1 }, end: { row: 2, column: 5 } },
        { start: { row: 2, column: 6 }, end: { row: 2, column: 10 } }
    ]

    // Create the excel report.
    // This function will return Buffer
    const report = excel.buildExport(
    [ // <- Notice that this is an array. Pass multiple sheets to create multi sheet report
        {
        name: 'Report', // <- Specify sheet name (optional)
        //heading: heading, // <- Raw heading array (optional)
        // merges: merges, // <- Merge cell ranges
        specification: specification, // <- Report specification
        data: dataset // <-- Report data
        }
    ]
    );

    // You can then return this straight
    _res.attachment('report.xlsx'); // This is sails.js specific (in general you need to set headers)
    return _res.send(report);
})

app.listen(PORT, () => { console.log(`Server listening on port ${PORT}`); });
