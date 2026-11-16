#!/usr/bin/env bash
set -euo pipefail

root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
categories=(bouldering mountaineering cars)
sizes=(2048 1280 800)
suffixes=('' '-medium' '-thumb')
optimized_count=0

optimize_image() {
    local input="$1"
    local folder="${input%/*}"
    local filename="${input##*/}"
    local stem="${filename%.*}"
    local -a outputs=()
    local -a temporary_paths=()
    local -a created_paths=()
    local index
    local answer

    for index in "${!sizes[@]}"; do
        outputs+=("$folder/$stem${suffixes[$index]}.webp")
    done

    for output in "${outputs[@]}"; do
        if [[ -e "$output" || -L "$output" ]]; then
            printf 'Skipped %s: %s already exists; source retained.\n' "${input#"$root"/}" "${output#"$root"/}" >&2
            return 2
        fi
    done

    for index in "${!outputs[@]}"; do
        local temporary="${outputs[$index]}.${BASHPID}.tmp.webp"
        temporary_paths+=("$temporary")
        if ! magick "$input" -auto-orient -resize "${sizes[$index]}x${sizes[$index]}>" -strip -quality 82 "$temporary"; then
            for temporary in "${temporary_paths[@]}"; do
                rm -f -- "$temporary"
            done
            return 1
        fi
    done

    for index in "${!outputs[@]}"; do
        if ! mv -- "${temporary_paths[$index]}" "${outputs[$index]}"; then
            for output in "${created_paths[@]}"; do
                rm -f -- "$output"
            done
            for temporary in "${temporary_paths[@]}"; do
                rm -f -- "$temporary"
            done
            return 1
        fi
        created_paths+=("${outputs[$index]}")
    done

    if exec 3<>/dev/tty 2>/dev/null; then
        read -r -p "Delete source image ${input#"$root"/}? [y/N] " answer <&3 || answer=''
        exec 3>&-
    else
        answer=''
    fi

    case "$answer" in
        [yY]|[yY][eE][sS]) ;;
        *)
            printf 'Keeping source image %s.\n' "${input#"$root"/}"
            return 0
            ;;
    esac

    if ! rm -- "$input"; then
        for output in "${created_paths[@]}"; do
            rm -f -- "$output"
        done
        printf 'Could not remove source image %s; generated WebP files rolled back.\n' "${input#"$root"/}" >&2
        return 1
    fi

    printf 'Optimized %s into three WebP sizes.\n' "${input#"$root"/}"
}

for category in "${categories[@]}"; do
    folder="$root/files/$category"
    while IFS= read -r -d '' input; do
        if optimize_image "$input"; then
            ((optimized_count += 1))
        else
            result=$?
            if [[ "$result" -ne 2 ]]; then
                printf 'Failed to optimize %s; JPEG retained.\n' "${input#"$root"/}" >&2
                exit 1
            fi
        fi
    done < <(find "$folder" -mindepth 2 -maxdepth 2 -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) -print0)
done

printf 'Optimized %s image(s).\n' "$optimized_count"
