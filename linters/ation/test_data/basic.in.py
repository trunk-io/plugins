#!/usr/bin/env python3

GLOBAL_CONSTANT_128 = 10 * 12 + 8

# TODO: This is super clean. But have we considered what to do about roundoff error?
def add(a, b):
    return a + b

# This is bad code
def fibonacci(n):
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    else:
        return fibonacci(n-1) + fibonacci(n-2)

if __name__ == "__main__":
  print("Hello, World!")
