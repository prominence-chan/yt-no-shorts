# Changelog

## 1.1.0 - 2026-11-21
- Hide the **Shorts** filter chip on search and shelves titled "Shorts" (new sweeper for elements CSS can't select)
- Hide the Shorts entry in the collapsed (mini) sidebar
- Fix: the page observer could fail to attach at `document-start` before `<html>` existed, which left some Shorts
  visible after in-app navigation

## 1.0.0 - 2026-11-21
- Initial release: hide Shorts across YouTube; `bruh stop scrolling` on Shorts pages
