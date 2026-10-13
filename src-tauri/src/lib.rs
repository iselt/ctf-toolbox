/// Offline-first CTF toolbox shell.
///
/// The whole UI is static local frontend; the only optional network-capable
/// piece is `tauri-plugin-http`, used exclusively by the HTTP Sender page to
/// reach user-specified targets (typically localhost / lab machines).
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .run(tauri::generate_context!())
        .expect("error while running CTF Toolbox");
}
