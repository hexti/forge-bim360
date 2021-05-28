var viewer;

// @urn the model to show
// @viewablesId which viewables to show, applies to BIM 360 Plans folder
function launchViewer(urn, viewableId) {
  var options = {
    env: 'AutodeskProduction',
    getAccessToken: getForgeToken,
    api: 'derivativeV2' + (atob(urn.replace('_', '/')).indexOf('emea') > -1 ? '_EU' : '') // handle BIM 360 US and EU regions
  };

  Autodesk.Viewing.Initializer(options, () => {
    var selected = getSelectedNode();
    let url = selected.project.split("/");
    let count = url.length - 1
    let containerId = url[count].substring(2);

    axios.get(`https://developer.api.autodesk.com/issues/v2/containers/${containerId}/issue-attribute-definitions?filter[dataType]=list`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then((res) => {
      $('.modal').modal('hide')
      let optionsNivelAlerta = '<option value="">Selecione ...</option>'
      let optionsFace = '<option value="" selected>Selecione ...</option>'

      res.data.results[0].metadata.list.options.forEach(element => {
        optionsFace += `<option value="${element.id}">${element.value}</option>`
      });

      res.data.results[1].metadata.list.options.forEach(element => {
        optionsNivelAlerta += `<option value="${element.id}">${element.value}</option>`
      });

      $("#nivelAlerta").html(optionsNivelAlerta).show();
      $("#face").html(optionsFace).show();
    })
    .catch((error) => {
        console.error(error)
    })

    //Causa raiz
    axios.get(`https://developer.api.autodesk.com/issues/v2/containers/${containerId}/issue-root-cause-categories?include=rootcauses&limit=9999`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then((res) => {
      let options = '<option value="">Selecione ...</option>'
      res.data.results.forEach(element => {
        if(element.isActive == true){
          element.rootCauses.forEach(causaRaiz => {
            if(causaRaiz.isActive == true){
              options += `<option value="${causaRaiz.id}">${causaRaiz.title}</option>`
            }
          });
        }
      });
      $("#causaRaiz").html(options).show();
    })
    .catch((error) => {
      console.error(error)
    })

    //Issues para popular o filtro
    axios.get(`https://developer.api.autodesk.com/issues/v1/containers/${containerId}/quality-issues?filter[target_urn]=${selected.urn}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then((res) => {
      let options = '<option value="">Selecione ...</option>'
      let optionsLocation = '<option value="">Selecione ...</option>'
      let location = []

      res.data.data.forEach(element => {
        options += `<option value="${element.id}">${element.attributes.identifier}</option>`

        //verifica se já existe um option com o mesmo valor
        if($.inArray(element.attributes.location_description, location) === -1){
          location.push(element.attributes.location_description);
          optionsLocation += `<option value="${element.attributes.location_description}">${element.attributes.location_description}</option>`
        }

      });

      $("#issueId").html(options).show();
      $("#location").html(optionsLocation).show();
    })
    .catch((error) => {
      console.error(error)
    })

    $('.btn-search-issues').show()

    viewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById('forgeViewer'), { extensions: [ 'Autodesk.DocumentBrowser', 'BIM360IssueExtension', 'IconMarkupExtension'] });
    viewer.start();

    viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, function ({ dbIdArray }) {
        const $viewer = $('.content .container-fluid.viewer')
        const $chart = $('.content .container-fluid.chartSensor')
        const dbId = dbIdArray[0]

        if ([57209, 57211, 57213, 57215].includes(dbId)) {
            viewer.getProperties(dbId, function () {
                if (window.chartSensorInterval) {
                    clearInterval(window.chartSensorInterval)
                }

                $viewer.addClass('col-sm-8')
                $chart.show(400)

                const emptyArray = Array.from({ length: 9 }, _ => '')

                const labels = [...emptyArray, moment().format('HH:mm:ss')]

                const datasets = [
                    {
                        label: `#${dbId}, Rotation X`,
                        data: [...emptyArray, Math.random() * (-0.04 - -0.01) + -0.01],
                        borderColor: '#16558c',
                        fill: false
                    },
                    {
                        label: `#${dbId}, Rotation Y`,
                        data: [...emptyArray, Math.random() * (-0.02 - 0.01) + 0.01],
                        borderColor: '##138f5b',
                        fill: false
                    },
                    {
                        label: `#${dbId}, Rotation Z`,
                        data: [...emptyArray, Math.random() * (-0.02 - 0.01) + 0.01],
                        borderColor: '#911649',
                        fill: false
                    }
                ]

                window.chartSensorInterval = setInterval(() => {
                    let data

                    labels.shift()
                    labels.push(moment().format('HH:mm:ss'))

                    data = datasets[0].data

                    data.shift()
                    data.push(Math.random() * (-0.04 - -0.01) + -0.01)

                    datasets[0].data = data

                    data = datasets[1].data

                    data.shift()
                    data.push(Math.random() * (-0.02 - 0.01) + 0.01)

                    datasets[1].data = data

                    data = datasets[2].data

                    data.shift()
                    data.push(Math.random() * (-0.02 - 0.01) + 0.01)

                    datasets[2].data = data

                    const chartData = {
                        labels,
                        datasets
                    }

                    if (window.chartSensor) {
                        window.chartSensor.destroy()
                    }

                    window.chartSensor = new Chart(
                        document.querySelector('.content .chartSensor .chart').getContext('2d'),
                        {
                            type: 'line',
                            data: chartData,
                            options: {
                                animation: false
                            }
                        }
                    )
                }, 1e3)
            })
        } else {
            $viewer.removeClass('col-sm-8')
            $chart.hide(200)

            if (window.chartSensorInterval) {
                clearInterval(window.chartSensorInterval)
            }

            if (window.chartSensor) {
                window.chartSensor.destroy()
            }
        }
    })

    var documentId = 'urn:' + urn;
    localStorage.setItem('urn', urn);
    Autodesk.Viewing.Document.load(documentId, onDocumentLoadSuccess, onDocumentLoadFailure);
  });

  function onDocumentLoadSuccess(doc) {
    // if a viewableId was specified, load that view, otherwise the default view
    var viewables = (viewableId ? doc.getRoot().findByGuid(viewableId) : doc.getRoot().getDefaultGeometry());
    viewer.loadDocumentNode(doc, viewables).then(i => {
      // any additional action here?
    });
  }

  function onDocumentLoadFailure(viewerErrorCode) {
    console.error('onDocumentLoadFailure() - errorCode:' + viewerErrorCode);
  }
}

function getForgeToken(callback) {
  fetch('/api/forge/oauth/token').then(res => {
    res.json().then(data => {
      localStorage.setItem('token', data.access_token);
      callback(data.access_token, data.expires_in);
    });
  });
}
