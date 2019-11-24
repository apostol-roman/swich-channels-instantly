module.exports = function SwitchChannelsInstantly(mod) {

    mod.hook('S_PREPARE_SELECT_CHANNEL', 1, event => {
        mod.send('C_SELECT_CHANNEL', 1);
    });
}
