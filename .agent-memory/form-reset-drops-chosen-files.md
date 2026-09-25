# A failed save must not drop a chosen file

React resets a `<form action={…}>` after every action, including one that
returns a validation error. Text fields survive because `VacancyForm` remounts
`VacancyFields` with the submitted values under a new `submissionId` key. A file
cannot come back that way: the server action never returns it, and a file
input's value cannot be set from a string.

The first photo field kept its preview in state while the reset emptied the
input, so the preview still showed a photo that the next save would not send.
`VacancyImageField` now keeps the chosen `File` in a ref and, on the form's
`reset` event, puts it back into the input through a `DataTransfer` once the
reset has run. The preview and the submitted file stay the same.

The general rule: anything a form action cannot hand back in its result has to
be restored on the client after the reset, or cleared along with its preview.
