const {watch} = require('fs');
const xs = require('xstream').default;

function makeRerequire(caller_require) {
    return function(module_id) {
        const module = caller_require.cache[module_id];
        var idx = -1;
        if (module && module.parent) {
            idx = module.parent.children.findIndex(function (m) { return m.id === module_id; });
            if (idx >= 0) module.parent.children.splice(idx, 1);
        }
        delete caller_require.cache[module_id];
        try {
            return caller_require(module_id);
        } catch (err) {
            console.error('Failed to require module', module_id, err);
            // restore old module
            caller_require.cache[module_id] = module;
            if (idx >= 0) module.parent.children.splice(idx, 0, module);
        }
    };
}

function noop() {}
const ignoringListener = { next: noop, complete: noop, error: noop };

module.exports = function(caller_require) {
    const rerequire = makeRerequire(caller_require);

    return function(id) {
        const module_id = caller_require.resolve(id);
        const obs = xs.createWithMemory({
            start: function (listener) {
                listener.next(rerequire(module_id));  // bootstrap
                this.watcher = watch(module_id, {persistent: false}, function (eventType, filename) {
                    if (eventType === 'change') {
                        listener.next(rerequire(module_id));
                    } else {  // eventType === 'rename'
                        listener.complete();
                        this.stop();
                    }
                });
            },
            stop: function () {
                if (this.watcher) {
                    this.watcher.close();
                    delete this.watcher;
                }
            }
        });
        obs.addListener(ignoringListener);  // make observable permanently hot
        return obs;
    }
};