# push code to x server (ssh x) ~/subsites/experiments.bdwm.be/phaser-examples

// exclude .git modules node_modules etc
rsync -r -v -e ssh --delete ./games/sokoban-responsive x:~/subsites/experiments.bdwm.be/phaser-examples/games/