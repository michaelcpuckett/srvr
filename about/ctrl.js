function aboutCtrl (data) {
    /*
        data = {
            api: {
                user: {
                    firstName: "Michael",
                    lastName: "Puckett"
                }
            }
        }
    */
    data = data || {};
    data.ctrlName = 'aboutCtrl';
    return data; // TODO
}

module.exports = aboutCtrl;
