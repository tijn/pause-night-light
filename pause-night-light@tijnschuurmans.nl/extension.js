const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const PopupMenu = imports.ui.popupMenu;
const Util = imports.misc.util;

const Gettext = imports.gettext.domain('pause-night-light');
const _ = Gettext.gettext;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const BUS_NAME = 'org.gnome.SettingsDaemon.Color';
const OBJECT_PATH = '/org/gnome/SettingsDaemon/Color';

const ColorInterface = '<node> \
<interface name="org.gnome.SettingsDaemon.Color"> \
  <property name="DisabledUntilTomorrow" type="b" access="readwrite"/> \
  <property name="NightLightActive" type="b" access="read"/> \
</interface> \
</node>';

const ColorProxy = Gio.DBusProxy.makeProxyWrapper(ColorInterface);

let pauseItem = null;
let proxy = null;
let timeout = null;

function pause(event) {
    if (proxy.DisabledUntilTomorrow) {
      return;
    }

    proxy.DisabledUntilTomorrow = true;
    timeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 10000, function() {
        proxy.DisabledUntilTomorrow = false;
        return false;
    }, null);
}

function init() {
    Convenience.initTranslations("pause-night-light");
    proxy = new ColorProxy(Gio.DBus.session, BUS_NAME, OBJECT_PATH, (proxy, error) => {
        if (error) {
          log(error.message);
          return;
        } });
}

function enable() {
    pauseItem = new PopupMenu.PopupMenuItem(_("Disable Briefly"));
    pauseItem.connect('activate', Lang.bind(this, function (menuItem, event) {
       pause(event);
    }));

    let menu = Main.panel.statusArea.aggregateMenu._nightLight._item.menu;
    menu.addMenuItem(pauseItem, 0);
}

function disable() {
    pauseItem.destroy();
    pauseItem = null;
    if (timeout) {
      Mainloop.source_remove(timeout);
      timeout = null;
    }
}
