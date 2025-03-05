# Import from the module that imports this module
from basic.in import function_for_circular_import

def some_function():
    return "This creates a circular import with basic.in.py"

# Use the imported function to complete the cycle
result = function_for_circular_import()
