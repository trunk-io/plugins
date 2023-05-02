# DJLint

- [README](https://github.com/Riverside-Healthcare/djlint#readme)
- [Rules](https://www.djlint.com/docs/linter/)

DJLint supports HTML templates for:

- Django
- Jinja
- Nunjucks
- Twig
- Handlebars
- Mustache
- GoLang
- Angular

For use of anything other than Django, please visit the readme and set the appropriate profile. You
can set the appropriate profile in your djlint run command or in the linter config.

[Example for Django](https://www.djlint.com/docs/languages/django/): Run command:
`djlint /path/to/templates --profile=django` or `./pyproject.toml`

```toml
[tool.djlint]
profile="django"
```
