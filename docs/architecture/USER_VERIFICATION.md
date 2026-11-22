# Volunteer verification

Administrators can assign or revoke the verified badge and upload or remove a custom badge. Organization affiliation assignment and display are removed.

`PUT /admin/verification/{id}` accepts only `verified`. The backend rejects organization assignments, excludes legacy affiliations from every verification response and clears them when verification changes. Existing database columns remain for compatibility. Uploading or removing a custom badge is independent of verification.
