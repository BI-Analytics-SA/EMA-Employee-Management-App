# Employee search and export configuration

The Employee screen searches all employee business fields in the active organization.
Enter a whole or partial value and click **Search** or press **Enter**. Matching ignores
case and surrounding whitespace. Multiple words can match different fields in the same
employee record. Dates support `YYYY-MM-DD`, `DD/MM/YYYY` and `DD-MM-YYYY`, using the
South African calendar day. Barcode scanning continues to search by the scanned ID.

Search covers employees beyond the first loaded page and has no 20-match limit.

## Transfer an export configuration

Organization admins can open **Settings → Modules → Export configuration** when the
Export to Excel module is enabled.

**Export configuration** downloads the current editor configuration as JSON, including
unsaved changes. It preserves column order, labels, data types, enabled and disabled
columns, and every custom field with its default value. The configuration can be backed
up or imported into another organization.

**Import configuration replaces the entire current configuration, including its existing
custom fields.** Custom fields in the imported file are included. Select a configuration
JSON file, review the columns in the editor, and click **Save configuration** to apply
the replacement. Refreshing the page before saving restores the saved configuration.

Invalid or unsupported files leave the editor unchanged and display an error. Files must
be no larger than 1 MB. Database columns absent from an imported file are available in
the editor but disabled; existing custom fields are not merged into the import.

## Release notes

Tracked in [PEPL-58](https://bkrgroup.atlassian.net/browse/PEPL-58). Brandon Rademan
tested and accepted the changes on Dev on 21 October 2026. No data migration, backfill,
or new module is required. Deploy the updated Convex functions before releasing the
frontend, which uses the new employee search query.
