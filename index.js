module.exports = function ExitInstantly(mod) {

    mod.hook('S_PREPARE_SELECT_CHANNEL', 1, event => {
        mod.send('S_SELECT_CHANNEL', 1, {
            category: 0,
            code: 0
        });
    });
}
