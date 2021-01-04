$(function () {
    const TRANSITION = 200
    const WAIT = 3500
    const $div = $('<div class="app-toast" style="display: none"></div>')
    const conteudo = document.createElement('div')
    const titulo = document.createElement('div')
    const corpo = document.createElement('div')

    conteudo.classList.add('conteudo')
    titulo.classList.add('titulo')
    corpo.classList.add('corpo')
    conteudo.append(titulo, corpo)
    $div.append(conteudo)

    /**
     *
     * @param {Object} conteudo
     * @param {string} conteudo.titulo
     * @param {string} conteudo.corpo
     */
    $.fn.toast = function (conteudo) {
        switch (typeof conteudo) {
            case 'object':
                if (conteudo.titulo) {
                    titulo.innerHTML = conteudo.titulo
                }

                corpo.innerHTML = conteudo.corpo
                break
            case 'string':
                corpo.innerHTML = conteudo
                break
        }

        $div.prependTo('body')
        $div.fadeIn(TRANSITION)

        setTimeout(() => {
            $div.fadeOut(TRANSITION, function () {
                $(this).remove()
            })
        }, WAIT)
    }
})
