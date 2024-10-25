import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Badge,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import {
  CalendarIcon,
  CheckIcon,
  ChevronLeftIcon,
  StarIcon,
  TimeIcon,
} from "@chakra-ui/icons";

// Interface for Ride data
interface Ride {
  id: number;
  user_id: number;
  status: string;
  pickup_location: string;
  destination_location: string;
  scheduled_time: string;
  offer?: {
    price: number;
    driver_id: number;
  };
  review?: {
    rating: number;
    comments: string;
  };
}

const DriverHistory: React.FC = () => {
  // Hooks for theming and navigation
  const bgColor = useColorModeValue("white", "gray.100");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const primaryColor = "#1F41BB";
  const navigate = useNavigate();

  // **Move this hook outside the map function**
  const reviewBgColor = useColorModeValue("gray.50", "gray.700");

  // Fetch completed rides data
  const {
    data: rides,
    isLoading,
    isError,
  } = useQuery<Ride[]>({
    queryKey: ["driverRides"],
    queryFn: async () => {
      const response = await axios.get("http://localhost:3001/api/v1/ride", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      // Get the current user's ID from the token
      const currentUserId = getUserIdFromToken(
        localStorage.getItem("token")
      );

      // Filter rides for the current user
      return response.data.filter(
        (ride: Ride) => ride.offer?.driver_id === currentUserId
      );
    },
  });

  // Filter completed rides
  const completedRides = rides?.filter(
    (ride) => ride.status.toUpperCase() === "COMPLETED"
  );

  // Helper function to extract user ID from token
  function getUserIdFromToken(token: string | null): number | null {
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }

  return (
    <Box maxWidth="800px" margin="auto" mt={4} p={4}>
      {/* Header with Back button and title */}
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Button
          leftIcon={<ChevronLeftIcon />}
          onClick={() => navigate(-1)}
          variant="ghost"
        >
          Back
        </Button>
        <Heading as="h1" size="xl" color={primaryColor}>
          Ride History
        </Heading>
        <Box width="40px" /> {/* This empty box balances the flex layout */}
      </Flex>

      {/* Rides list */}
      {isLoading ? (
        <Text>Loading ride history...</Text>
      ) : isError ? (
        <Text>Error loading ride history</Text>
      ) : (
        <VStack spacing={6} align="stretch">
          {completedRides?.map((ride) => (
            <Box
              key={ride.id}
              p={6}
              borderWidth={1}
              borderRadius="lg"
              borderColor={borderColor}
              bg={bgColor}
              boxShadow="md"
              transition="all 0.3s"
              _hover={{ transform: "translateY(-5px)", boxShadow: "lg" }}
            >
              <Flex justifyContent="space-between" alignItems="center" mb={4}>
                <Badge
                  colorScheme="green"
                  fontSize="0.8em"
                  p={2}
                  borderRadius="full"
                >
                  <Icon as={CheckIcon} mr={1} /> Completed
                </Badge>
                <Text fontWeight="bold" fontSize="lg">
                  Ride #{ride.id.toString().padStart(4, "0")}
                </Text>
              </Flex>

              <VStack align="stretch" spacing={3}>
                <HStack>
                  <Icon as={ChevronLeftIcon} color={primaryColor} />
                  <Text fontWeight="medium">From: {ride.pickup_location}</Text>
                </HStack>
                <HStack>
                  <Icon
                    as={ChevronLeftIcon}
                    transform="rotate(180deg)"
                    color={primaryColor}
                  />
                  <Text fontWeight="medium">
                    To: {ride.destination_location}
                  </Text>
                </HStack>
                <HStack>
                  <Icon as={CalendarIcon} color={primaryColor} />
                  <Text>
                    {new Date(ride.scheduled_time).toLocaleDateString()}
                  </Text>
                </HStack>
                <HStack>
                  <Icon as={TimeIcon} color={primaryColor} />
                  <Text>
                    {new Date(ride.scheduled_time).toLocaleTimeString()}
                  </Text>
                </HStack>
                {ride.offer && (
                  <HStack>
                    <Text fontWeight="bold" color={primaryColor}>
                      $
                    </Text>
                    <Text fontWeight="bold">{ride.offer.price.toFixed(2)}</Text>
                  </HStack>
                )}
              </VStack>

              {/* Display review if available */}
              {ride.review && (
                <Box mt={4} p={4} bg={reviewBgColor} borderRadius="md">
                  <Flex alignItems="center" mb={2}>
                    <Icon as={StarIcon} color="yellow.400" mr={2} />
                    <Text fontWeight="bold">
                      Rating: {ride.review.rating} / 5
                    </Text>
                  </Flex>
                  <Text fontStyle="italic">"{ride.review.comments}"</Text>
                </Box>
              )}
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default DriverHistory;
