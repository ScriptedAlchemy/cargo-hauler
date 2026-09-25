use std::{env, path::Path, thread, time::Duration};

fn main() {
    match env::var("CARGO_PKG_NAME").as_deref() {
        Ok("fast-a") => {
            println!("cargo:rerun-if-env-changed=CC_EVAL_FAST_SLEEP_MS");
            let millis = env::var("CC_EVAL_FAST_SLEEP_MS")
                .ok()
                .and_then(|value| value.parse::<u64>().ok())
                .unwrap_or(0);
            thread::sleep(Duration::from_millis(millis));
        }
        Ok("slow-b") => {
            println!("cargo:rerun-if-env-changed=CC_EVAL_SLOW_GATE");
            if let Ok(gate) = env::var("CC_EVAL_SLOW_GATE") {
                while !Path::new(&gate).exists() {
                    thread::sleep(Duration::from_millis(20));
                }
            }
        }
        _ => {}
    }
}
