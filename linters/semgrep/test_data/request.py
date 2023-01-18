
def unvalidated_value(request):
    value = request.GET.get('something')
    function = globals().get(value)

    if function:
        return function(request)
