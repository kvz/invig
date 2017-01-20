# Contributing

We're welcoming contributions of all kinds. For bigger things, please first open an issue so
we can discuss and not waste anybody's time.

## Install

First, fork and clone the repo. Or if you have contributor access, clone the main repo directly:

```bash
cd ~/code
git clone git@github.com:kvz/invig.git
cd invig
```

and be sure to branch out:

```bash
git checkout master
git pull
git checkout -b <your-feature-or-fix-name>
```

Now, feel free to make changes.

## Test

Invig tests by converting legacy code and comparing the output of the process, as well as 
the actual resulting ES6 code to [Jest snapshots](https://facebook.github.io/jest/blog/2016/07/27/jest-14.html) bundled
with this repo.

To test against the snapshots:

```bash
npm run test
```

To build new snapshots:

```bash
npm run test:update
```

Be sure to carefully inspect the Git diff before committing new snapshots.

## Commit

If the new snapshots look as intended, commit your work and the snapshots.

```bash
git add -p
git commit
git push
```

Now you can send a PR for your branch or fork against `kvz/master`, we'll review, and hopefully, merge :tada: :smile:
