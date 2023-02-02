# git-blame-ignore-revs

This action will automatically configure git blame to use the `.git-blame-ignore-revs` file while it
exists. A typical use of this file is to run `trunk fmt -a` on a repository. Commit those changes,
and then add the git commit sha256 to that file. This will cause `git blame` to skip that formatting
commit when deciding who last changed each line.

See also: https://git-scm.com/docs/git-blame#Documentation/git-blame.txt-blameignoreRevsFile
