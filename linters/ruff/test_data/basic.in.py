def main():
    try:
        pass
    except (Exception, TypeError):
        pass

# trunk-ignore(ruff/F401): this will trigger a warning to verify that the config is applied
import sys

class NoDocstring(object):
    def __init__(self, arg1):
        self._attr1 = arg1

class Globe(object):
    def __init__(self):
        self.shape = 'spheroid'
