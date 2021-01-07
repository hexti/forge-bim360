/**
 * Ocupa a CPU para esperar antes de prosseguir para a próxima instrução.
 *
 * @param {number} segundos
 */
function idle (segundos = 0.2) {
    return new Promise((resolve) => {
        const t = new Date().getTime() + (segundos * 1000)
        while (new Date().getTime() <= t) {
            resolve()
        }
    })
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
