// A version of main.rs that requires a semicolon, and should be autofixed rather than returning a
// linter failure.
mod high

fn main() {
    let x = 1;
    let y = 2;
    if x == y || x < y {}
    println!("Hello World");
}
