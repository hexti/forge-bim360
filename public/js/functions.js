/**
 * Timeout assíncrono para esperar antes de prosseguir para a próxima instrução.
 *
 * @param {Number} segundos
 * @return {Promise}
 */
function idle (segundos = 0.2) {
    const timeout = segundos * 1e3
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve()
        }, timeout)
    })
}

/**
 * Ocupa a CPU para esperar antes de prosseguir para a próxima instrução.
 *
 * @param {Number} segundos
 */
function idleSync (segundos = 0.2) {
    const t = new Date().getTime() + (segundos * 1000)
    while (new Date().getTime() <= t) { }
}

/**
 * Retorna uma função Promise.
 *
 * @param {Function} fn
 * @return {Function}
 */
function promisify (fn) {
    const isPromisified = function (f) {
        try {
            return f.__isPromisified__ === true
        } catch (e) {
            return false
        }
    }

    if (typeof fn !== 'function') {
        throw new TypeError('O argumento precisa ser uma Function!')
    }

    if (isPromisified(fn)) {
        return fn
    }

    const _ = this.Promise

    if (typeof _ !== 'function') {
        throw new Error(
            'Nenhuma implementação de Promise foi encontrada. Será necessário usar Polyfill.'
        )
    }

    const func = function (...args) {
        func.prototype.__isPromisified__ = true

        return new _((resolve, reject) => {
            function callback() {
                try {
                    resolve(fn(...args))
                } catch (err) {
                    reject(err)
                }

            }

            callback.apply(func, args)
        })
    }

    return func
}

promisify.prototype.Promise = Promise

/**
 * Cria uma url do objeto passado no argumento.
 *
 * @param {any} obj
 * @param {HTMLElement | Boolean} el Retorna o elemento HTML ou string URL se True
 * @example
 *  const url = createObjectURL(blob, true);
 *  const img = createObjectURL(blob);
 *
 *  const el = document.createElement('img');
 *  const a  = createObjectURL(blob, el);
 */
function createObjectURL (obj, el = false) {
    const url = URL.createObjectURL(obj)
    let img

    // Se True retorna apenas a url.
    if (typeof el === 'boolean' && el) {
        return url
    }

    if (typeof el !== 'object') {
        img = document.createElement('img')
    } else {
        img = el
    }

    img.onload = function () {
        URL.revokeObjectURL(url)
    }

    img.src = url

    return img
}

/**
 * Verifica se o elemento é HTMLElement ou Element.
 *
 * @param {HTMLElement} el
 * @return {Boolean}
 */
function isHTMLElement (el) {
    return el && (el instanceof HTMLElement || el instanceof Element)
}

/**
 * Cria um overlay e anexa ao pai de um elemento ou ao Body do HTML.
 *
 * @param {Object} options
 * @param {Boolean} options.exibir Exibir ou não o spinner
 * @param {HTMLElement | String} options.el Elemento para qual anexar
 */
function loadingOverlay (options = {}) {
    /**
     * @return {HTMLElement}
     */
    const createOverlay  = () => {
        const overlay = document.createElement('div')

        overlay.classList.add('loading-overlay')
        overlay.style.opacity = '0'

        overlay.innerHTML = `
            <div class="preloader">
                <div class="spinner-layer">
                    <div class="circle-clipper left">
                        <div class="circle"></div>
                    </div>
                    <div class="circle-clipper right">
                        <div class="circle"></div>
                    </div>
                </div>
            </div>
        `

        return overlay
    }

    /**
     * @param {HTMLElement} el
     * @return {Boolean}
     */
    const whichTransition = (el) => {
        const transitions = {
            transition: 'transitionend',
            OTransition: 'oTransitionEnd',
            MozTransition: 'transitionend',
            WebkitTransition: 'webkitTransitionEnd'
        }

        for (const t in transitions) {
            if (el.style[t] !== undefined) {
                return transitions[t]
            }
        }
    }

    return new Promise((resolve, reject) => {
        const parent = isHTMLElement(options.el)
            ? options.el : typeof options.el === 'string'
                ? document.querySelector(options.el) : document.body

        if (!parent) {
            reject(new TypeError('Não conseguiu encontrar um elemento pai para anexar o spinner.'))
        }

        const loading = document.querySelector('.loading-overlay')
        const overlay = loading || createOverlay()
        const exibir = typeof options.exibir === 'boolean' ? options.exibir : true
        const anexado = !!loading

        if ((!exibir && !anexado) || (exibir && anexado && overlay.style.opacity === '1'))
            return resolve()

        overlay.addEventListener(whichTransition(overlay), () => {
            !exibir && anexado && parent.removeChild(overlay)
            resolve()
        })

        if ((exibir && overlay.style.opacity === '0') || (!anexado && exibir)) {
            parent.appendChild(overlay)

            // nextTick
            setTimeout(() => {
                overlay.style.opacity = '1'
            }, 100)
        } else if (anexado && overlay.style.opacity === '1' && !exibir) {
            overlay.style.opacity = '0'
        }
    })
}
