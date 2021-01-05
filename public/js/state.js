const $api = axios.create({
    baseURL: 'https://developer.api.autodesk.com',
    headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
    }
})
