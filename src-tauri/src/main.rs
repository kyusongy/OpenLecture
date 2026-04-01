#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};
use tauri_plugin_shell::ShellExt;

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
struct AppConfig {
    dashscope_api_key: Option<String>,
    dashscope_endpoint: Option<String>,
}

struct AppState {
    backend_port: Mutex<u16>,
    config: Mutex<AppConfig>,
}

fn config_dir() -> PathBuf {
    let dir = dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("OpenLecture");
    fs::create_dir_all(&dir).ok();
    dir
}

fn config_path() -> PathBuf {
    config_dir().join("config.json")
}

fn load_config() -> AppConfig {
    let path = config_path();
    if path.exists() {
        let data = fs::read_to_string(&path).unwrap_or_default();
        serde_json::from_str(&data).unwrap_or_default()
    } else {
        AppConfig::default()
    }
}

fn save_config(config: &AppConfig) {
    let path = config_path();
    if let Ok(data) = serde_json::to_string_pretty(config) {
        fs::write(path, data).ok();
    }
}

#[tauri::command]
fn get_config(state: tauri::State<'_, AppState>) -> AppConfig {
    state.config.lock().unwrap().clone()
}

#[tauri::command]
fn set_config(state: tauri::State<'_, AppState>, key: String, value: String) -> AppConfig {
    let mut config = state.config.lock().unwrap();
    match key.as_str() {
        "dashscope_api_key" => config.dashscope_api_key = Some(value),
        "dashscope_endpoint" => config.dashscope_endpoint = Some(value),
        _ => {}
    }
    save_config(&config);
    config.clone()
}

#[tauri::command]
fn get_backend_port(state: tauri::State<'_, AppState>) -> u16 {
    *state.backend_port.lock().unwrap()
}

fn main() {
    let config = load_config();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState {
            backend_port: Mutex::new(0),
            config: Mutex::new(config),
        })
        .invoke_handler(tauri::generate_handler![get_config, set_config, get_backend_port])
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                start_backend(handle).await;
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn start_backend(handle: AppHandle) {
    let state = handle.state::<AppState>();
    let config = state.config.lock().unwrap().clone();

    let api_key = config.dashscope_api_key.unwrap_or_default();
    let endpoint = config
        .dashscope_endpoint
        .unwrap_or_else(|| "international".to_string());
    let data_dir = config_dir().join("data").to_string_lossy().to_string();

    let shell = handle.shell();
    let sidecar = shell
        .sidecar("openlecture-server")
        .expect("failed to create sidecar command")
        .env("DASHSCOPE_API_KEY", &api_key)
        .env("DASHSCOPE_ENDPOINT", &endpoint)
        .env("DATA_DIR", &data_dir)
        .env("OPENLECTURE_APP_MODE", "desktop");

    let (mut rx, _child) = sidecar.spawn().expect("failed to spawn sidecar");

    use tauri_plugin_shell::process::CommandEvent;
    while let Some(event) = rx.recv().await {
        match event {
            CommandEvent::Stdout(line) => {
                let line = String::from_utf8_lossy(&line);
                if let Some(port_str) = line.trim().strip_prefix("OPENLECTURE_PORT=") {
                    if let Ok(port) = port_str.parse::<u16>() {
                        *state.backend_port.lock().unwrap() = port;
                        wait_for_health(port).await;
                        if let Some(window) = handle.get_webview_window("main") {
                            window.show().ok();
                        }
                        break;
                    }
                }
            }
            CommandEvent::Stderr(line) => {
                let line = String::from_utf8_lossy(&line);
                eprintln!("[backend] {}", line.trim());
            }
            CommandEvent::Error(err) => {
                eprintln!("[sidecar error] {}", err);
                break;
            }
            CommandEvent::Terminated(_) => {
                eprintln!("[sidecar] process terminated unexpectedly");
                break;
            }
            _ => {}
        }
    }
}

async fn wait_for_health(port: u16) {
    let url = format!("http://127.0.0.1:{}/api/health", port);
    let client = reqwest::Client::new();

    for _ in 0..60 {
        match client.get(&url).send().await {
            Ok(resp) if resp.status().is_success() => return,
            _ => {}
        }
        tokio::time::sleep(std::time::Duration::from_millis(500)).await;
    }

    eprintln!("[sidecar] health check timed out after 30s");
}
