# Updated



# Original

BYU Job Script Generator
=====================

Generate batch job scripts for Slurm and PBS.

###[Demo](https://byuhpc.github.io/BYUJobScriptGenerator/)

Code is licensed under the LGPL v3.  Enjoy.

It is quite likely that you will need to make modifications to the Javascript.  Different sites have very different ways of configuring scheduling systems, and this script reflects how BYU has set up its systems.  Attempts have been made to make the code flexible.  Several items have been added for demonstration purposes (feature and partition names, documentation links, etc.).

BYU uses a feature-based scheduling system.  Users are not told about the existence of partitions.  They request time, cores, memory, and node features but not partitions.  The Slurm configuration includes the all_partitions submit plugin and a Lua job submit script that assigns jobs to the right partition(s).  Since many sites do things differently, partition support was added to this code.
