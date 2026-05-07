Place a portable Git Bash runtime in `runtime/<arch>/` for Windows packaging,
or let the packaging step download it.

Expected packaged shell path:

`resources/git-bash/usr/bin/bash.exe`

Expected source/prepared shell path before packaging:

`apps/desktop/resources/git-bash/runtime/<arch>/usr/bin/bash.exe`

The packaging hook injects `runtime/<arch>/` directly based on the current
electron-builder target architecture. `runtime/current/` is only a legacy/manual
compatibility location and is not used for target-scoped packaging.

The bundle must include the supporting Git for Windows runtime directories
such as `usr/`, `bin/`, and `mingw64/`; copying only `bash.exe` is not enough.

If `runtime/<arch>/usr/bin/bash.exe` is missing, the matching Windows packaging
command will require `PI_APP_GIT_BASH_URL_<ARCH>` or `PI_APP_GIT_BASH_URL` to
point at a portable Git for Windows zip. The downloaded archive is cached under
`PI_APP_GIT_BASH_CACHE_DIR` when set, or `~/.cache/pi-gui/git-bash/` by default.
