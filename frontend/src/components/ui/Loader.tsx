import React from 'react';
import { ThreeCircles } from 'react-loader-spinner';
import { colors } from '../../styles/colors';

interface LoaderProps {
    visible: boolean;
    height?: string;
    width?: string;
    color?: string;
    wrapperStyle?: React.CSSProperties;
    wrapperClass?: string;
}

const Loader: React.FC<LoaderProps> = ({
    visible,
    height = '100',
    width = '100',
    color = colors.primary,
    wrapperStyle = {},
    wrapperClass = '',
}) => {
    return (
        <ThreeCircles
            visible={visible}
            height={height}
            width={width}
            color={color}
            ariaLabel="three-circles-loading"
            wrapperStyle={wrapperStyle}
            wrapperClass={wrapperClass}
        />
    );
};

export default Loader;
