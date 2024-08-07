import React, { useState, useEffect, useRef } from 'react';

const VirtualizedList = ({ items, renderItem, itemHeight, windowHeight }) => {
  const [scrollTop, setScrollTop] = useState(0);
  const listRef = useRef();

  useEffect(() => {
    const handleScroll = () => {
      setScrollTop(listRef.current.scrollTop);
    };

    const listElement = listRef.current;
    listElement.addEventListener('scroll', handleScroll);

    return () => {
      listElement.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + windowHeight) / itemHeight)
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);

  return (
    <div
      ref={listRef}
      style={{ height: windowHeight, overflowY: 'auto' }}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              top: (startIndex + index) * itemHeight,
              height: itemHeight,
            }}
          >
            {renderItem(item)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VirtualizedList;