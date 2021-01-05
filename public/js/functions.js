/**
 * Ocupa a CPU para esperar antes de prosseguir para a próxima instrução.
 *
 * @param {number} segundos
 */
function aguardar (segundos = 0.2) {
    const t = new Date().getTime() + (segundos * 1000)
    while (new Date().getTime() <= t) {}
}

/**
 * Retorna uma função Promise.
 *
 * @param {Function} fn
 * @return {Function}
 */
function promisify (fn) {
    if (typeof fn !== 'function') {
        throw new TypeError('O argumento precisa ser uma Function!')
    }

    const _ = Promise

    if (typeof _ !== 'function') {
        throw new Error(
            'Nenhuma implementação de Promise foi encontrada. Será necessário usar Polyfill.'
        )
    }

    return function (...args) {
        return new _((resolve, reject) => {
            args.push(function callback(err, ...values) {
                if (err) {
                    return reject(err)
                }

                resolve(values)
            })

            fn.apply(this, args)
        })
    }
}
