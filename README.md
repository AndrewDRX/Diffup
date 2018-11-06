# Diffup
### A javascript diff tool for rendered markup.
Licensed under the MIT License. See the `LICENSE` file for details.

## Sample Usage
```javascript
document.getElementById('markup_diff').innerHTML = (
  Diffup.Diff(
    document.getElementById('markup_left').innerHTML,
    document.getElementById('markup_right').innerHTML
  )
);
```
