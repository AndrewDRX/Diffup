/*
MIT License

Copyright (c) 2018 Andrew Donald Reilly

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
( function Initialize( ) {
  function CreateElement( options ) {
    var element;
    switch( options.type ) {
      case 'root':
        element = document.createElement( 'div' );
        element.innerHTML = options.html;
        break;
      default:
        element = document.createElement( options.type );
        element.innerHTML = options.template.element.outerHTML;
        if( options.parent )
          options.parent.element.insertBefore( element, options.parent.element.firstChild )
        else if( options.replace ) {
          options.replace.parent.element.replaceChild( element, options.replace.element );
          options.replace.element = element;
        } else if( options.sibling ) {
          options.sibling.parent.element.insertBefore( element, options.sibling.element );
        }
    }
    return element;
  }
  function GenerateMarkupDiff( left, right ) {
    if( !left.hierarchy.length && !right.hierarchy.length ) return GenerateTextDiff( left, right );
    for( var index_right = 0; index_right < right.hierarchy.length; index_right++ ) {
      var current_right = right.hierarchy[ index_right ];
      for( var index_left = 0; index_left < left.hierarchy.length; index_left++ ) {
        var current_left = left.hierarchy[ index_left ];
        if( typeof current_left.index !== 'undefined' ) continue;
        if( GetSimilarity( current_left.element.outerHTML, current_right.element.outerHTML ) < 0.9 ) continue;
        current_right.index = index_left;
        current_left.index = index_left;
        GenerateMarkupDiff( current_left, current_right );
        break;
      }
      if( typeof current_right.index === 'undefined' )
        CreateElement( {
          type: 'ins',
          template: current_right,
          replace: current_right
        } );
    }
    for( var index_left = 0; index_left < left.hierarchy.length; index_left++ ) {
      var current_left = left.hierarchy[ index_left ];
      if( typeof current_left.index !== 'undefined' ) continue;
      for( var index_right = right.hierarchy.length - 1; index_right >= 0; index_right-- ) {
        var current_right = right.hierarchy[ index_right ];
        if( typeof current_right.index === 'undefined' ) continue;
        var previous_right = right.hierarchy[ index_right + 1 ];
        if( index_left < current_right.index ) continue;
        current_left.index = current_right.index;
        CreateElement( {
          type: 'del',
          template: current_left,
          sibling: typeof previous_right !== 'undefined' && typeof previous_right.index === 'undefined' ? previous_right : current_right
        } );
        break;
      }
      if( typeof current_left.index === 'undefined' )
        CreateElement( {
          type: 'del',
          template: current_left,
          parent: right.parent
        } );
    }
  }
  function GenerateTextDiff( left, right ) {
    var split_text_left = left.element.innerText.split( ' ' );
    var split_text_right = right.element.innerText.split( ' ' );
    var split_object_left = [ ];
    var split_object_right = [ ];
    for( var index_left = 0; index_left < split_text_left.length; index_left++ ) {
      var current_left = split_text_left[ index_left ];
      if( current_left === '' ) current_left = ' ';
      split_object_left.push( { text: current_left } );
    }
    for( var index_right = 0; index_right < split_text_right.length; index_right++ ) {
      var current_right = split_text_right[ index_right ];
      if( current_right === '' ) current_right = ' ';
      split_object_right.push( { text: current_right } );
    }
    for( var index_right = 0; index_right < split_object_right.length; index_right++ ) {
      var current_right = split_object_right[ index_right ];
      for( var index_left = 0; index_left < split_object_left.length; index_left++ ) {
        var current_left = split_object_left[ index_left ];
        if( typeof current_left.index !== 'undefined' ) continue;
        if( GetSimilarity( current_left.text, current_right.text ) < 1 ) continue;
        current_right.index = index_left;
        current_left.index = index_left;
        break;
      }
      if( typeof current_right.index === 'undefined' )
        current_right.text = '<ins>' + current_right.text + '</ins>';
    }
    for( var index_left = 0; index_left < split_object_left.length; index_left++ ) {
      var current_left = split_object_left[ index_left ];
      if( typeof current_left.index !== 'undefined' ) continue;
      for( var index_right = split_object_right.length - 1; index_right >= 0; index_right-- ) {
        var current_right = split_object_right[ index_right ];
        if( typeof current_right.index === 'undefined' ) continue;
        var previous_right = split_object_right[ index_right + 1 ];
        if( index_left < current_right.index ) continue;
        current_left.index = current_right.index;
        var edit_right = typeof previous_right !== 'undefined' && typeof previous_right.index === 'undefined' ? previous_right : current_right;
        edit_right.text = '<del>' + current_left.text + '</del>' + edit_right.text;
        break;
      }
      if( typeof current_left.index === 'undefined' )
        split_object_right[ 0 ].text = '<del>' + current_left.text + '</del>' + split_object_right[ 0 ].text;
    }
    split_text_right = [ ];
    for( var index_right = 0; index_right < split_object_right.length; index_right++ )
      split_text_right.push( split_object_right[ index_right ].text );
    right.element.innerHTML = split_text_right.join( ' ' );
  }
  function GetDiff( left, right ) {
    if( !left || !right ) return '<del>' + ( left || '' ) + '</del><ins>' + ( right || '' ) + '</ins>';
    left = GetElementHierarchy.call( { }, CreateElement( { type: 'root', html: left } ) ).hierarchy[ 0 ];
    right = GetElementHierarchy.call( { }, CreateElement( { type: 'root', html: right } ) ).hierarchy[ 0 ];
    GenerateMarkupDiff( left, right );
    return right.element.innerHTML;
  }
  function GetElementHierarchy( element ) {
    this.element = element;
    this.hierarchy = this.hierarchy || [ ];
    for( var index = 0; index < element.children.length; index++ ) {
      this.hierarchy.push( GetElementHierarchy.call( { hierarchy: [ ], parent: this }, element.children[ index ] ) );
    }
    return this;
  }
  function GetSimilarity( left, right ) {
    left = left.toLowerCase( );
    right = right.toLowerCase( );
    var costs = new Array( );
    for( var i = 0; i <= left.length; i++ ) {
      var lastValue = i;
      for( var j = 0; j <= right.length; j++ ) {
        if( i == 0 )
          costs[ j ] = j;
        else {
          if( j > 0 ) {
            var newValue = costs[ j - 1 ];
            if( left.charAt( i - 1 ) != right.charAt( j - 1 ) )
              newValue = Math.min( Math.min( newValue, lastValue ), costs[ j ] ) + 1;
            costs[ j - 1 ] = lastValue;
            lastValue = newValue;
          }
        }
      }
      if( i > 0 )
        costs[ right.length ] = lastValue;
    }
    return Math.abs( ( right.length - costs[ right.length ] ) / right.length );
  }
  window.Diffup = {
    Diff: GetDiff
  };
} )( );
